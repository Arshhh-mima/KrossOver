import { createActor } from "@/backend";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProfile } from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Camera, CheckCircle, Loader2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type OnboardingPageProps = {
  onComplete: () => void;
};

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { identity } = useInternetIdentity();
  const { actor } = useActor(createActor);
  const createProfile = useCreateProfile();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Pre-fill username from localStorage if set during password auth sign-up
  // Use a ref guard so this only runs once on mount, no stale closure issues
  // Pre-fill username from localStorage only once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const storedUsername = localStorage.getItem("krossover_username");
    if (storedUsername) {
      setUsername(storedUsername);
      setDisplayName(
        storedUsername.charAt(0).toUpperCase() +
          storedUsername.slice(1).replace(/_/g, " "),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUsername = useCallback(
    async (val: string) => {
      if (!val.trim()) return;
      if (val.length < 3) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus("checking");
      // Safety net: if the check hangs for 2s, resolve as idle so button is not blocked forever
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(() => {
        setUsernameStatus((prev) => (prev === "checking" ? "idle" : prev));
      }, 2000);
      try {
        if (!actor) {
          setUsernameStatus("idle");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (actor as any).getProfileByUsername(val);
        setUsernameStatus(existing ? "taken" : "available");
      } catch {
        setUsernameStatus("idle");
      } finally {
        if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkUsername(username);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, checkUsername]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedUsername || !trimmedDisplayName) {
      toast.error("Username and display name are required");
      return;
    }

    if (trimmedUsername.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }

    if (usernameStatus === "taken") {
      toast.error("That username is already taken. Please choose another.");
      return;
    }

    if (usernameStatus === "invalid") {
      toast.error("Username must be at least 3 characters.");
      return;
    }

    // If actor is not yet ready, wait up to 10s before failing
    if (!actor) {
      toast.error("Connecting to server — please wait a moment and try again.");
      return;
    }

    try {
      // Convert base64/data URL avatar to Uint8Array, or pass empty array for default
      let avatarBytes: Uint8Array = new Uint8Array(0);
      if (avatarPreview?.startsWith("data:")) {
        const base64 = avatarPreview.split(",")[1];
        if (base64) {
          const binary = atob(base64);
          avatarBytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            avatarBytes[i] = binary.charCodeAt(i);
          }
        }
      }

      await createProfile.mutateAsync({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        bio: bio.trim(),
        avatar: avatarBytes,
      });

      toast.success("Welcome to KrossOver! 🎉");
      // Small delay to let the toast show before navigation
      setTimeout(() => {
        onComplete();
      }, 300);
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Failed to create profile — please try again.";

      // Translate IC0508 canister-stopped error into user-friendly message
      const isCanisterStopped =
        rawMsg.includes("IC0508") ||
        rawMsg.includes("is stopped") ||
        rawMsg.includes("Canister") ||
        rawMsg.includes("stopped");

      const displayMsg = isCanisterStopped
        ? "App is starting up — please wait a moment and try again."
        : rawMsg;

      toast.error(displayMsg);

      if (
        rawMsg.toLowerCase().includes("username") ||
        rawMsg.toLowerCase().includes("taken")
      ) {
        setUsernameStatus("taken");
      }
    }
  };

  // Allow submission if username check is "checking" but username looks valid —
  // the server-side check in createProfile mutation will catch duplicates.
  // Only hard-block on "taken" or "invalid" statuses.
  const isSubmitDisabled =
    createProfile.isPending ||
    !displayName.trim() ||
    username.trim().length < 3 ||
    usernameStatus === "taken" ||
    usernameStatus === "invalid";

  return (
    <div
      className="page-bg min-h-screen flex items-center justify-center p-4"
      data-ocid="onboarding.page"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, oklch(0.56 0.22 320), transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-card rounded-3xl card-shadow p-8 w-full max-w-md"
        style={{ border: "1px solid oklch(0.24 0.01 260)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <img
            src="/assets/generated/krossover-logo.dim_80x80.png"
            alt="KrossOver"
            className="h-14 w-14 rounded-xl mb-3"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="text-[24px] font-bold text-foreground">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground text-[14px] mt-1 text-center">
            Create your KrossOver identity to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} alt="Your avatar" />
                <AvatarFallback
                  className="text-xl font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
                    color: "white",
                  }}
                >
                  {displayName.slice(0, 2).toUpperCase() || "K+"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 primary-btn rounded-full p-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                aria-label="Upload profile photo"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  data-ocid="onboarding.avatar.upload_button"
                />
              </label>
            </div>
            <p className="text-[12px] text-muted-foreground mt-2">
              Add a profile photo
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[13px] font-semibold">
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""),
                  )
                }
                placeholder="your_username"
                className={`rounded-xl bg-secondary border-border pr-10 ${
                  usernameStatus === "taken" || usernameStatus === "invalid"
                    ? "border-destructive focus-visible:ring-destructive"
                    : usernameStatus === "available"
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }`}
                required
                autoComplete="username"
                data-ocid="onboarding.username.input"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {(usernameStatus === "taken" ||
                  usernameStatus === "invalid") && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>

            {usernameStatus === "taken" && (
              <p
                className="text-destructive text-[12px]"
                data-ocid="onboarding.username.field_error"
              >
                Username already taken. Please choose another.
              </p>
            )}
            {usernameStatus === "invalid" && username.length > 0 && (
              <p
                className="text-destructive text-[12px]"
                data-ocid="onboarding.username.field_error"
              >
                Username must be at least 3 characters.
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="text-green-500 text-[12px]">
                Username is available!
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-[13px] font-semibold">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="rounded-xl bg-secondary border-border"
              required
              autoComplete="name"
              data-ocid="onboarding.displayname.input"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-[13px] font-semibold">
              Bio{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself..."
              className="rounded-xl resize-none bg-secondary border-border"
              rows={3}
              maxLength={150}
              data-ocid="onboarding.bio.textarea"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>

          <Button
            type="submit"
            className="w-full primary-btn rounded-xl font-semibold py-2.5"
            disabled={isSubmitDisabled}
            data-ocid="onboarding.submit_button"
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Profile"
            )}
          </Button>

          {createProfile.isError && (
            <p
              className="text-destructive text-[12px] text-center"
              data-ocid="onboarding.error_state"
            >
              {createProfile.error instanceof Error
                ? createProfile.error.message
                : "Failed to create profile. Please try again."}
            </p>
          )}

          <p className="text-[12px] text-center text-muted-foreground">
            {username
              ? `Username: ${username}`
              : identity
                ? `Signed in as: ${identity.getPrincipal().toString().slice(0, 12)}...`
                : null}
          </p>
        </form>
      </motion.div>
    </div>
  );
}
