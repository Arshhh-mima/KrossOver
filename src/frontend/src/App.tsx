import { Toaster } from "@/components/ui/sonner";
import {
  useMyProfile,
  useRegisterPushToken,
  useUpdateActivityStatus,
} from "@/hooks/useQueries";
import { AuthPage } from "@/pages/AuthPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { HomePage } from "@/pages/HomePage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ReelsPage } from "@/pages/ReelsPage";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const TOAST_STYLE = {
  background: "oklch(0.155 0.008 260)",
  color: "oklch(0.93 0.008 250)",
  border: "1px solid oklch(0.24 0.01 260)",
};

// ─── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-bg min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <img
              src="/lion-logo.svg"
              alt="KrossOver"
              className="h-16 w-16 rounded-xl"
            />
            <p className="text-foreground font-semibold text-[16px]">
              Something went wrong
            </p>
            <p className="text-muted-foreground text-[13px] max-w-[260px]">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="primary-btn px-6 py-2 rounded-full text-[14px] font-semibold transition-smooth"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Push Notification Helper ────────────────────────────────────────────────

function PushNotificationRegistrar() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const registerPushToken = useRegisterPushToken();
  const mutateFn = registerPushToken.mutate;

  useEffect(() => {
    if (!identity || !profile) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") {
      void registerPushSubscription(mutateFn);
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          void registerPushSubscription(mutateFn);
        }
      });
    }
  }, [identity, profile, mutateFn]);

  return null;
}

async function registerPushSubscription(mutateFn: (token: string) => void) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existingSub = await reg.pushManager.getSubscription();
    const sub =
      existingSub ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM4YnOlMYbgKqEEcUiCNuTDCNPP78TU9QfWBfLPPLmr-gRTTVBetg",
        ),
      }));
    mutateFn(JSON.stringify(sub));
  } catch {
    // Push subscription not available — silent fail
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

// ─── Activity Status Beacon ──────────────────────────────────────────────────

function ActivityStatusBeacon() {
  const { identity } = useInternetIdentity();
  const updateActivity = useUpdateActivityStatus();
  const mutate = updateActivity.mutate;

  useEffect(() => {
    if (!identity) return;
    mutate();
    const interval = setInterval(() => {
      mutate();
    }, 60_000);
    return () => clearInterval(interval);
  }, [identity, mutate]);

  return null;
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

function RootLayout() {
  useEffect(() => {
    const handler = () => {
      toast("New version available! Tap to update.", {
        action: {
          label: "Update",
          onClick: () => window.location.reload(),
        },
        duration: 10000,
      });
    };
    window.addEventListener("swUpdate", handler);
    return () => window.removeEventListener("swUpdate", handler);
  }, []);

  return (
    <>
      <ActivityStatusBeacon />
      <PushNotificationRegistrar />
      <Outlet />
      <Toaster position="top-center" toastOptions={{ style: TOAST_STYLE }} />
    </>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});
const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reels",
  component: ReelsPage,
});
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});
const profileUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: ProfilePage,
});
const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  reelsRoute,
  notificationsRoute,
  profileRoute,
  profileUserRoute,
  messagesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen({
  message,
  timedOut,
  onRetry,
}: {
  message: string;
  timedOut: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-4 text-center">
        <img
          src="/lion-logo.svg"
          alt="KrossOver"
          className={`h-16 w-16 rounded-xl ${timedOut ? "" : "animate-pulse"}`}
        />
        {timedOut ? (
          <>
            <p className="text-muted-foreground text-[14px] tracking-wide max-w-[220px]">
              Taking longer than expected…
            </p>
            <button
              type="button"
              data-ocid="loading.retry_button"
              onClick={onRetry}
              className="primary-btn px-6 py-2 rounded-full text-[14px] font-semibold transition-smooth"
            >
              Tap to Retry
            </button>
          </>
        ) : (
          <p className="text-muted-foreground text-[14px] tracking-wide">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const { identity, isInitializing: iiIsInitializing } = useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useMyProfile();
  const [onboardingDone, setOnboardingDone] = useState(false);

  // Force initialization to complete after 3s so the login screen always appears
  const [initForced, setInitForced] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setInitForced(true), 3_000);
    return () => clearTimeout(t);
  }, []);
  const isInitializing = iiIsInitializing && !initForced;

  // Password auth fallback — user logged in via username+password
  const isPasswordAuth =
    typeof window !== "undefined" &&
    localStorage.getItem("krossover_password_auth") === "true";

  // For password-auth users, we mark onboarding as done automatically
  // because they already went through registerWithPassword + profile creation
  // or they are an existing returning user who must not see onboarding.
  // We use a dedicated localStorage flag set after profile creation.
  const passwordAuthHasProfile =
    isPasswordAuth &&
    (localStorage.getItem("krossover_profile_created") === "true" ||
      localStorage.getItem("krossover_returning_user") === "true");

  // Treat password-authed users as authenticated for gating purposes
  const isAuthenticated = !!identity || isPasswordAuth;

  // Timeout for isInitializing: 3 seconds — after that, show auth page anyway
  const [initTimedOut, setInitTimedOut] = useState(false);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timeout for profileLoading: 5 seconds — after that, proceed to app/login
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retry counter — incrementing forces a re-evaluation of state
  const [, setRetryCount] = useState(0);

  const handleRetry = () => {
    setInitTimedOut(false);
    setProfileTimedOut(false);
    setRetryCount((c) => c + 1);
    window.location.reload();
  };

  // isInitializing timeout — 3 seconds
  useEffect(() => {
    if (isInitializing) {
      setInitTimedOut(false);
      initTimerRef.current = setTimeout(() => {
        setInitTimedOut(true);
      }, 3_000);
    } else {
      setInitTimedOut(false);
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
    }
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
    };
  }, [isInitializing]); // eslint-disable-line react-hooks/exhaustive-deps

  // profileLoading timeout — 5 seconds (only fires when II-authenticated)
  useEffect(() => {
    if (identity && profileLoading) {
      setProfileTimedOut(false);
      profileTimerRef.current = setTimeout(() => {
        setProfileTimedOut(true);
      }, 5_000);
    } else {
      setProfileTimedOut(false);
      if (profileTimerRef.current) {
        clearTimeout(profileTimerRef.current);
        profileTimerRef.current = null;
      }
    }
    return () => {
      if (profileTimerRef.current) {
        clearTimeout(profileTimerRef.current);
        profileTimerRef.current = null;
      }
    };
  }, [identity, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gate 1: II initializing ──────────────────────────────────────────────
  // If II is still initializing AND we haven't timed out AND no password auth,
  // show brief loader. After 3s timeout → fall through to show auth page.
  if (isInitializing && !initTimedOut && !isPasswordAuth) {
    return (
      <LoadingScreen
        message="Loading KrossOver..."
        timedOut={false}
        onRetry={handleRetry}
      />
    );
  }

  // ── Gate 2: Not authenticated ────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-center" toastOptions={{ style: TOAST_STYLE }} />
      </>
    );
  }

  // ── Gate 3: Password-auth returning user → skip onboarding, go straight to app ──
  // If user already completed profile creation during a previous session,
  // do not show onboarding — take them directly into the app.
  if (isPasswordAuth && passwordAuthHasProfile) {
    return <RouterProvider router={router} />;
  }

  // ── Gate 4: Profile loading (II users only) ──────────────────────────────
  if (identity && profileLoading && !profileTimedOut && !onboardingDone) {
    return (
      <LoadingScreen
        message="Loading KrossOver..."
        timedOut={false}
        onRetry={handleRetry}
      />
    );
  }

  // ── Gate 5: No profile — show onboarding ────────────────────────────────
  // For password-auth users without profile flag, show onboarding once.
  // For II users, show if profile query returned nothing.
  const needsOnboarding = isPasswordAuth
    ? !passwordAuthHasProfile && !onboardingDone
    : !profile && !onboardingDone;

  if (needsOnboarding) {
    return (
      <OnboardingPage
        onComplete={() => {
          // Mark profile as created for password-auth users so they skip onboarding next time
          if (isPasswordAuth) {
            localStorage.setItem("krossover_profile_created", "true");
          }
          // Refetch profile so the main app has user data, then flip the gate
          void refetchProfile().finally(() => {
            setOnboardingDone(true);
          });
        }}
      />
    );
  }

  // ── Authenticated + profile ready (or timed out) → render the full app ──
  return <RouterProvider router={router} />;
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppErrorBoundary>
      <AppShell />
    </AppErrorBoundary>
  );
}
