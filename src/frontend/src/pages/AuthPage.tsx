import { Button } from "@/components/ui/button";
import {
  useAuthenticateWithPassword,
  useRegisterWithPassword,
} from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const features = [
  { emoji: "📸", label: "Share moments with photos & videos" },
  { emoji: "🎬", label: "Watch and post reels" },
  { emoji: "💬", label: "Message and connect with friends" },
  { emoji: "🔍", label: "Explore content from all users" },
  { emoji: "❤️", label: "Like, comment, and save posts" },
];

type Tab = "ii" | "password";
type PasswordMode = "signin" | "signup";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const inputBaseClass =
  "w-full rounded-xl px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-all auth-field-input";

const inputStyle = {
  background: "oklch(0.14 0.008 260)",
  border: "1px solid oklch(0.24 0.01 260)",
};

export function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  // Default to password tab with signin mode — most users logging into existing accounts
  const [tab, setTab] = useState<Tab>("password");
  // Force both tabs to render at least once so they are never tree-shaken away
  const [_tabsRendered, setTabsRendered] = useState<Record<Tab, boolean>>({
    password: true,
    ii: true,
  });
  const [mode, setMode] = useState<PasswordMode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [usernameFormatError, setUsernameFormatError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = useRegisterWithPassword();
  const authMutation = useAuthenticateWithPassword();

  const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

  const resetForm = () => {
    setFormError("");
    setSuccessMsg("");
    setUsernameFormatError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setUsername(val);
    if (mode === "signup" && val.length > 0) {
      if (!USERNAME_REGEX.test(val)) {
        setUsernameFormatError(
          val.length < 3
            ? "Username must be at least 3 characters."
            : "Username can only contain letters, numbers, underscores, and dots (3-20 chars).",
        );
      } else {
        setUsernameFormatError("");
      }
    } else {
      setUsernameFormatError("");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!username.trim()) {
      setFormError("Username is required.");
      return;
    }
    if (mode === "signup" && !USERNAME_REGEX.test(username.trim())) {
      setFormError(
        "Username can only contain letters, numbers, underscores, and dots (3-20 chars).",
      );
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hashedPassword = await sha256(password);

      if (mode === "signup") {
        const regResult = await registerMutation.mutateAsync({
          username: username.trim(),
          passwordHash: hashedPassword,
        });
        // Handle error result from registration
        if (
          regResult &&
          typeof regResult === "object" &&
          "__kind__" in regResult &&
          regResult.__kind__ === "err"
        ) {
          setFormError(
            regResult.err || "Registration failed. Try a different username.",
          );
          return;
        }
        setSuccessMsg("Account created! Please sign in.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setUsernameFormatError("");
      } else {
        const result = await authMutation.mutateAsync({
          username: username.trim(),
          passwordHash: hashedPassword,
        });

        if (result?.success) {
          localStorage.setItem("krossover_password_auth", "true");
          localStorage.setItem("krossover_username", username.trim());
          // Mark both flags so onboarding is always skipped for returning sign-in users
          localStorage.setItem("krossover_profile_created", "true");
          localStorage.setItem("krossover_returning_user", "true");
          window.location.reload();
        } else {
          setFormError(
            result?.error ??
              "Incorrect username or password. Please try again.",
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTabStyle = {
    background:
      "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
    color: "oklch(0.98 0 0)",
  };
  const inactiveTabStyle = { color: "oklch(0.6 0.01 260)" };

  return (
    <div
      className="page-bg min-h-screen flex items-center justify-center p-4 overflow-hidden"
      data-ocid="auth.page"
    >
      {/* Ambient glow effects */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.56 0.22 320), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, oklch(0.48 0.24 295), transparent 70%)",
          }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-56 h-56 rounded-full opacity-6"
          style={{
            background:
              "radial-gradient(circle, oklch(0.60 0.20 340), transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 bg-card rounded-3xl card-shadow p-8 w-full max-w-sm text-center"
        style={{ border: "1px solid oklch(0.24 0.01 260)" }}
        data-ocid="auth.panel"
      >
        {/* Logo + Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          className="mb-6"
        >
          <div className="relative inline-flex items-center justify-center mb-4">
            <div
              className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
              }}
            />
            <img
              src="/assets/generated/krossover-logo.dim_80x80.png"
              alt="KrossOver"
              className="relative h-16 w-16 rounded-2xl shadow-lg"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = "/lion-logo.svg";
              }}
            />
          </div>

          <h1
            className="text-[32px] font-bold tracking-tight leading-tight"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            KrossOver
          </h1>
          <p className="text-muted-foreground text-[14px] mt-1 font-medium">
            Connect. Share. Discover.
          </p>
        </motion.div>

        {/* Feature list — only show on II tab */}
        <AnimatePresence mode="wait">
          {tab === "ii" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 mb-5">
                {features.map(({ emoji, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="flex items-center gap-3 bg-secondary rounded-xl p-2.5 text-left"
                  >
                    <span className="text-[16px] flex-shrink-0">{emoji}</span>
                    <span className="text-[12px] font-medium text-foreground">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex rounded-xl p-1 mb-5"
          style={{ background: "oklch(0.14 0.008 260)" }}
          role="tablist"
          aria-label="Login method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "password"}
            data-ocid="auth.tab.password"
            onClick={() => {
              setTab("password");
              setTabsRendered((prev) => ({ ...prev, password: true }));
              resetForm();
            }}
            className="flex-1 text-[13px] font-semibold py-2 rounded-lg transition-all duration-200"
            style={tab === "password" ? activeTabStyle : inactiveTabStyle}
          >
            Username &amp; Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "ii"}
            data-ocid="auth.tab.ii"
            onClick={() => {
              setTab("ii");
              setTabsRendered((prev) => ({ ...prev, ii: true }));
              resetForm();
            }}
            className="flex-1 text-[13px] font-semibold py-2 rounded-lg transition-all duration-200"
            style={tab === "ii" ? activeTabStyle : inactiveTabStyle}
          >
            Internet Identity
          </button>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === "ii" ? (
            <motion.div
              key="ii-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full primary-btn rounded-xl font-semibold py-3 text-[15px] h-auto"
                data-ocid="auth.login.primary_button"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Sign In with Internet Identity"
                )}
              </Button>
              <p className="text-[12px] text-muted-foreground mt-2.5">
                Secure, passwordless sign-in via Internet Identity
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="password-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sign In / Sign Up toggle */}
              <div
                className="flex rounded-lg p-0.5 mb-4"
                style={{ background: "oklch(0.14 0.008 260)" }}
              >
                <button
                  type="button"
                  data-ocid="auth.password.signin_tab"
                  onClick={() => {
                    setMode("signin");
                    setFormError("");
                    setSuccessMsg("");
                    setUsernameFormatError("");
                  }}
                  className="flex-1 text-[13px] font-bold py-2 rounded-md transition-all duration-200"
                  style={
                    mode === "signin"
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
                          color: "oklch(0.98 0 0)",
                          boxShadow: "0 1px 8px oklch(0.56 0.22 320 / 0.35)",
                        }
                      : { color: "oklch(0.55 0.01 260)" }
                  }
                >
                  Sign In
                </button>
                <button
                  type="button"
                  data-ocid="auth.password.signup_tab"
                  onClick={() => {
                    setMode("signup");
                    setFormError("");
                    setSuccessMsg("");
                    setUsernameFormatError("");
                  }}
                  className="flex-1 text-[13px] font-bold py-2 rounded-md transition-all duration-200"
                  style={
                    mode === "signup"
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
                          color: "oklch(0.98 0 0)",
                          boxShadow: "0 1px 8px oklch(0.56 0.22 320 / 0.35)",
                        }
                      : { color: "oklch(0.55 0.01 260)" }
                  }
                >
                  Sign Up
                </button>
              </div>

              {/* Helper text under sign-in mode */}
              {mode === "signin" && (
                <p className="text-[12px] text-muted-foreground mb-3 text-left">
                  Welcome back! Enter your username and password to access your
                  account.
                </p>
              )}

              {/* Success message */}
              {successMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12px] font-medium mb-3 px-3 py-2 rounded-lg text-left"
                  style={{
                    background: "oklch(0.22 0.08 145 / 0.3)",
                    color: "oklch(0.75 0.12 145)",
                    border: "1px solid oklch(0.35 0.08 145 / 0.4)",
                  }}
                  data-ocid="auth.password.success_state"
                >
                  {successMsg}
                </motion.p>
              )}

              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-3 text-left"
              >
                {/* Username */}
                <div>
                  <label
                    htmlFor="auth-username"
                    className="block text-[12px] font-medium text-muted-foreground mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="your_username"
                    data-ocid="auth.password.username_input"
                    className={inputBaseClass}
                    style={inputStyle}
                  />
                  {usernameFormatError && (
                    <p
                      className="text-[11px] mt-1 font-medium"
                      style={{ color: "oklch(0.75 0.12 25)" }}
                      data-ocid="auth.password.username_field_error"
                    >
                      {usernameFormatError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-[12px] font-medium text-muted-foreground mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      data-ocid="auth.password.password_input"
                      className={`${inputBaseClass} pr-10`}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      data-ocid="auth.password.toggle_password"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password — only for Sign Up */}
                <AnimatePresence>
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label
                        htmlFor="auth-confirm-password"
                        className="block text-[12px] font-medium text-muted-foreground mb-1"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="auth-confirm-password"
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          data-ocid="auth.password.confirm_input"
                          className={`${inputBaseClass} pr-10`}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          aria-label={
                            showConfirm ? "Hide password" : "Show password"
                          }
                          data-ocid="auth.password.toggle_confirm"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[12px] font-medium px-3 py-2 rounded-lg"
                    style={{
                      background: "oklch(0.22 0.08 25 / 0.3)",
                      color: "oklch(0.75 0.12 25)",
                      border: "1px solid oklch(0.35 0.08 25 / 0.4)",
                    }}
                    data-ocid="auth.password.error_state"
                  >
                    {formError}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full primary-btn rounded-xl font-semibold py-3 text-[15px] h-auto mt-1"
                  data-ocid="auth.password.submit_button"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === "signup"
                        ? "Creating account..."
                        : "Signing in..."}
                    </span>
                  ) : mode === "signup" ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* New user hint under sign-in mode */}
                {mode === "signin" && (
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    New to KrossOver?{" "}
                    <button
                      type="button"
                      data-ocid="auth.password.goto_signup"
                      onClick={() => {
                        setMode("signup");
                        setFormError("");
                        setSuccessMsg("");
                      }}
                      className="font-semibold hover:underline"
                      style={{ color: "oklch(0.65 0.18 320)" }}
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with &#10084; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
