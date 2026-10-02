import { useNotifications } from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  Edit3,
  Film,
  Home,
  MessageCircle,
  Search,
} from "lucide-react";
import type React from "react";

type HeaderProps = {
  onCreatePost?: () => void;
  onSearch?: () => void;
};

function LionLogo({ className }: { className?: string }) {
  return (
    <img
      src="/lion-logo.svg"
      alt="KrossOver Lion"
      className={className}
      onError={(e) => {
        // Fallback to generated PNG if SVG fails
        (e.currentTarget as HTMLImageElement).src =
          "/assets/generated/lion-logo.dim_512x512.png";
      }}
    />
  );
}

export function CaffeineFooter() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utmUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;
  return (
    <p className="text-center text-[10px] text-muted-foreground/50 py-1 select-none">
      © {year}.{" "}
      <a
        href={utmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-muted-foreground transition-colors"
      >
        Built with caffeine.ai
      </a>
    </p>
  );
}

export function Header({ onCreatePost, onSearch }: HeaderProps) {
  const { identity } = useInternetIdentity();

  return (
    <header className="header-blur sticky top-0 z-40" data-ocid="header.panel">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo + Name */}
        <Link
          to="/"
          className="flex items-center gap-2"
          data-ocid="header.link"
        >
          <LionLogo className="h-8 w-8 rounded-xl object-cover" />
          <span
            className="font-bold text-[20px] tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            KrossOver
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {identity && (
            <>
              <button
                type="button"
                onClick={onSearch}
                className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Search"
                data-ocid="header.search_button"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onCreatePost}
                className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Create post"
                data-ocid="header.primary_button"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <Link
                to="/messages"
                className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Messages"
                data-ocid="header.messages.link"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

type BottomDockProps = {
  onCreatePost?: () => void;
};

type NavItem = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ocid: string;
  isNotif?: boolean;
};

export function BottomDock({ onCreatePost }: BottomDockProps) {
  const { identity } = useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: notifications } = useNotifications();

  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

  const navItems: NavItem[] = [
    { to: "/", icon: Home, label: "Home", ocid: "nav.home.link" },
    {
      to: "/explore",
      icon: Compass,
      label: "Explore",
      ocid: "nav.explore.link",
    },
    { to: "/reels", icon: Film, label: "Reels", ocid: "nav.reels.link" },
    {
      to: "/notifications",
      icon: Bell,
      label: "Activity",
      ocid: "nav.notifications.link",
      isNotif: true,
    },
    {
      to: "/profile",
      icon: MessageCircle,
      label: "Profile",
      ocid: "nav.profile.link",
    },
  ];

  return (
    <nav
      className="bottom-dock fixed bottom-0 left-0 right-0 z-40 flex flex-col px-2 safe-area-inset-bottom"
      aria-label="Main navigation"
      data-ocid="nav.panel"
    >
      <CaffeineFooter />
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label, ocid, isNotif }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              data-ocid={ocid}
            >
              <div className="relative">
                {to === "/profile" && identity ? (
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? "ring-2 ring-primary" : ""
                    }`}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))"
                        : "oklch(0.24 0.01 260)",
                      color: isActive ? "white" : "oklch(0.68 0.018 250)",
                    }}
                  >
                    {identity
                      .getPrincipal()
                      .toString()
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                ) : (
                  <Icon
                    className={`h-6 w-6 ${isActive ? "text-primary" : ""} transition-colors`}
                  />
                )}
                {isNotif && hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full border border-background" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : ""}`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Floating create button in center on mobile */}
        {identity && (
          <button
            type="button"
            onClick={onCreatePost}
            className="absolute -top-5 left-1/2 -translate-x-1/2 h-11 w-11 rounded-full primary-btn flex items-center justify-center shadow-lg"
            aria-label="Create post"
            data-ocid="nav.create.button"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.56 0.22 320), oklch(0.48 0.24 295))",
            }}
          >
            <Edit3 className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
    </nav>
  );
}
