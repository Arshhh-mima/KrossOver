/**
 * useStorageClient — provides a properly authenticated upload interface
 * that uses the EXACT SAME internal StorageClient created by createActorWithConfig.
 *
 * Fix for 403 "Invalid payload" at StorageClient.getCertificate:
 *
 * Root cause: any separately-created StorageClient (even with the same identity)
 * can fail because the agent.call() for "_immutableObjectStorageCreateCertificate"
 * requires the exact same HttpAgent instance (with the same initialized delegation
 * chain) as the one used for the main actor. Creating a new HttpAgent separately,
 * even with the same DelegationIdentity object, can produce requests that the
 * IC gateway rejects with 403 "Invalid payload".
 *
 * Solution: Use useActor() with a custom createActor function that captures the
 * uploadFile and downloadFile callbacks that createActorWithConfig already built
 * with a correctly-configured StorageClient + agent. These callbacks are cached
 * by React Query (staleTime: Infinity) so they reuse the same StorageClient
 * instance that is also used for all backend calls.
 *
 * Upload flow:
 *   1. ExternalBlob.fromBytes(bytes) wraps the Uint8Array
 *   2. uploadFn(blob) calls storageClient.putFile internally → returns "!caf!<hash>"
 *   3. Decode hash from the "!caf!" prefix sentinel
 *   4. downloadFn(hashBytes) calls storageClient.getDirectURL → returns URL
 *
 * Readiness contract:
 *   - isReady: true  → adapter is fully initialized, upload() is safe to call
 *   - isReady: false → adapter is still loading; caller MUST wait before uploading
 *   - waitUntilReady(timeoutMs) → resolves when ready, rejects on timeout
 */

import { useActor } from "@caffeineai/core-infrastructure";
import type { createActorFunction } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useCallback, useRef } from "react";

// The sentinel prefix that createActorWithConfig uses when encoding the hash
const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";

// The shape returned by our custom "actor" — exposes the platform's upload/download fns
interface UploadAdapter {
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>;
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>;
}

// Custom createActor function that captures uploadFile / downloadFile
// instead of building a real actor. These callbacks close over the correctly-
// authenticated StorageClient that createActorWithConfig already built.
const createUploadAdapter: createActorFunction<UploadAdapter> = (
  _canisterId,
  uploadFile,
  downloadFile,
): UploadAdapter => {
  return { uploadFile, downloadFile };
};

export interface StorageUploadResult {
  url: string;
  hash: string;
}

/**
 * Returns an `upload` function that uploads a File (or Uint8Array) using the
 * platform's authenticated StorageClient and returns the direct URL.
 *
 * The upload adapter is cached by React Query alongside the backend actor —
 * same agent, same StorageClient, zero 403 risk.
 *
 * Also exports `waitUntilReady(timeoutMs)` which resolves as soon as the
 * adapter becomes available. Use this in upload orchestrators to avoid
 * racing against initialization.
 */
export function useStorageClient() {
  const { actor: adapter, isFetching } = useActor(createUploadAdapter);

  // Keep a stable ref to the latest adapter so waitUntilReady doesn't need
  // to close over a stale value from a previous render.
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;
  const isFetchingRef = useRef(isFetching);
  isFetchingRef.current = isFetching;

  /**
   * Polls every 500 ms until the adapter is ready (not fetching + adapter present).
   * Rejects if the adapter is still not ready after `timeoutMs` (default 15 s).
   */
  const waitUntilReady = useCallback((timeoutMs = 15_000): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already ready — resolve immediately
      if (adapterRef.current && !isFetchingRef.current) {
        resolve();
        return;
      }

      const started = Date.now();
      const interval = setInterval(() => {
        if (adapterRef.current && !isFetchingRef.current) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - started >= timeoutMs) {
          clearInterval(interval);
          reject(
            new Error(
              "Storage not ready — please wait for the app to finish loading or sign in again.",
            ),
          );
        }
      }, 500);
    });
  }, []);

  const upload = useCallback(
    async (
      file: File | Uint8Array,
      onProgress?: (pct: number) => void,
    ): Promise<StorageUploadResult> => {
      // If the adapter isn't ready yet, wait up to 15s before failing.
      // This prevents 403 "Invalid payload" when the agent delegation chain
      // hasn't finished initialising yet.
      if (!adapterRef.current || isFetchingRef.current) {
        await new Promise<void>((resolve, reject) => {
          const started = Date.now();
          const iv = setInterval(() => {
            if (adapterRef.current && !isFetchingRef.current) {
              clearInterval(iv);
              resolve();
            } else if (Date.now() - started >= 15_000) {
              clearInterval(iv);
              reject(
                new Error(
                  "Storage not ready — please wait for the app to finish loading or sign in again.",
                ),
              );
            }
          }, 300);
        });
      }

      const currentAdapter = adapterRef.current;
      if (!currentAdapter) {
        throw new Error(
          "Storage not ready — please wait for the app to finish loading or sign in again.",
        );
      }

      // Convert File → Uint8Array<ArrayBuffer> (ExternalBlob.fromBytes requires ArrayBuffer, not ArrayBufferLike)
      const rawBuffer =
        file instanceof File ? await file.arrayBuffer() : file.buffer;
      const bytes = new Uint8Array(
        rawBuffer instanceof SharedArrayBuffer ? rawBuffer.slice(0) : rawBuffer,
      ) as Uint8Array<ArrayBuffer>;

      // Wrap in ExternalBlob with optional progress tracking
      const blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob.withUploadProgress(onProgress);
      }

      // Retry loop with exponential backoff specifically for 403 errors.
      // 403 "Invalid payload" means the agent delegation chain is not yet ready
      // even though isFetching=false — a short wait and retry resolves it.
      const MAX_RETRIES = 5;
      let lastError: unknown;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Ensure adapter is still present before each attempt
          if (!adapterRef.current) {
            throw new Error("Storage adapter lost — please sign in again.");
          }
          const currentAdapterAttempt = adapterRef.current;
          // uploadFile closes over the internal StorageClient — same agent as the actor
          const hashBytes = await currentAdapterAttempt.uploadFile(blob);

          // Decode the "!caf!<hash>" sentinel encoding used by the platform
          const hashWithPrefix = new TextDecoder().decode(hashBytes);
          const hash = hashWithPrefix.startsWith(MOTOKO_DEDUPLICATION_SENTINEL)
            ? hashWithPrefix.substring(MOTOKO_DEDUPLICATION_SENTINEL.length)
            : hashWithPrefix;

          if (!hash || !hash.startsWith("sha256:")) {
            throw new Error(
              `Storage returned unexpected hash format: "${hash.slice(0, 60)}"`,
            );
          }

          // downloadFile closes over the same StorageClient → returns the direct URL
          const externalBlob = await currentAdapter.downloadFile(
            new TextEncoder().encode(MOTOKO_DEDUPLICATION_SENTINEL + hash),
          );
          const url = externalBlob.getDirectURL();

          if (!url || !url.startsWith("http")) {
            throw new Error(
              `Storage returned invalid URL: "${String(url).slice(0, 80)}"`,
            );
          }

          return { url, hash };
        } catch (err) {
          lastError = err;
          const errStr = err instanceof Error ? err.message : String(err);
          const is403 =
            errStr.includes("403") ||
            errStr.includes("Forbidden") ||
            errStr.includes("Invalid payload");
          const isCanisterStopped =
            errStr.includes("IC0508") ||
            errStr.includes("is stopped") ||
            errStr.includes("Reject code: 5");

          if (isCanisterStopped) {
            throw new Error(
              "App is starting up — please wait a moment, then try uploading again.",
            );
          }

          if (attempt < MAX_RETRIES - 1 && is403) {
            // Exponential backoff: 1s, 2s, 4s, 8s
            const delay = 1_000 * 2 ** attempt;
            console.warn(
              `[StorageClient] 403 on attempt ${attempt + 1}/${MAX_RETRIES}, retrying in ${delay / 1000}s...`,
              err,
            );
            await new Promise((r) => setTimeout(r, delay));
            // Refresh adapter reference in case it re-initialised
            if (!adapterRef.current) continue;
            continue;
          }
          // Non-403 error or last attempt — throw with friendly message
          if (is403) {
            throw new Error(
              "Upload failed: authentication error. Please sign out and sign back in, then try again.",
            );
          }
          throw err;
        }
      }

      throw lastError;
    },
    [],
  );

  const isReady = !!adapter && !isFetching;

  return { upload, isReady, waitUntilReady };
}
