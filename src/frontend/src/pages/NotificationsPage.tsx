import { BottomDock, Header } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllUsers,
  useFollowUser,
  useIsFollowing,
  useMarkNotificationsRead,
  useNotifications,
} from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Bell, Heart, MessageCircle, StickyNote, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

function NotificationIcon({ kind }: { kind: string }) {
  if (kind === "like")
    return <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />;
  if (kind === "comment")
    return <MessageCircle className="h-3.5 w-3.5 text-primary fill-primary" />;
  if (kind === "note_reply")
    return <StickyNote className="h-3.5 w-3.5 text-yellow-400" />;
  return <UserPlus className="h-3.5 w-3.5 text-green-500" />;
}

function actionText(kind: string): string {
  switch (kind) {
    case "like":
      return "liked your photo.";
    case "comment":
      return "commented on your post.";
    case "follow":
      return "started following you.";
    case "note_reply":
      return "replied to your note.";
    default:
      return "interacted with you.";
  }
}

export function NotificationsPage() {
  const { identity, login } = useInternetIdentity();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: allUsers = [] } = useAllUsers();
  const markRead = useMarkNotificationsRead();
  const followUser = useFollowUser();

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  // Mark all as read when the page loads (if there are unread ones)
  // biome-ignore lint/correctness/useExhaustiveDependencies: markRead is stable mutation fn
  useEffect(() => {
    if (identity && notifications.some((n) => !n.isRead)) {
      markRead.mutate();
    }
  }, [identity, notifications]);

  if (!identity) {
    return (
      <div className="page-bg min-h-screen" data-ocid="notifications.page">
        <Header />
        <main
          className="max-w-lg mx-auto px-4 pt-16 pb-28 text-center"
          data-ocid="notifications.empty_state"
        >
          <Bell className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-[20px] font-bold text-foreground mb-2">
            Activity
          </h2>
          <p className="text-muted-foreground text-[14px] mb-6">
            Sign in to see likes, comments, and follows.
          </p>
          <Button
            onClick={login}
            className="gold-btn px-6 py-2 rounded-full font-semibold"
            data-ocid="notifications.login.primary_button"
          >
            Sign In
          </Button>
        </main>
        <BottomDock />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const handleFollowBack = (principal: unknown) => {
    followUser.mutate(principal, {
      onSuccess: () => toast.success("Now following!"),
      onError: () => toast.error("Could not follow user"),
    });
  };

  return (
    <div className="page-bg min-h-screen" data-ocid="notifications.page">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-6 pb-28">
        <h1 className="text-[18px] font-bold text-foreground mb-4">Activity</h1>

        {isLoading ? (
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
              >
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="bg-card rounded-2xl card-shadow p-12 text-center"
            data-ocid="notifications.empty_state"
          >
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">
              No activity yet
            </p>
            <p className="text-[13px] text-muted-foreground">
              When people like, comment, or follow you, you'll see it here.
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <section className="mb-6">
                <p className="text-[12px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
                  New
                </p>
                <div
                  className="bg-card rounded-2xl card-shadow overflow-hidden"
                  data-ocid="notifications.new.list"
                >
                  {unread.map((notif, i) => {
                    const fromProfile = profileMap.get(
                      notif.fromUser.toString(),
                    );
                    return (
                      <NotificationRow
                        key={notif.id.toString()}
                        kind={notif.kind}
                        fromProfile={fromProfile}
                        fromPrincipal={notif.fromUser}
                        createdAt={notif.createdAt}
                        index={i}
                        isNew
                        onFollow={() => handleFollowBack(notif.fromUser)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {read.length > 0 && (
              <section>
                <p className="text-[12px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
                  Earlier
                </p>
                <div
                  className="bg-card rounded-2xl card-shadow overflow-hidden"
                  data-ocid="notifications.earlier.list"
                >
                  {read.map((notif, i) => {
                    const fromProfile = profileMap.get(
                      notif.fromUser.toString(),
                    );
                    return (
                      <NotificationRow
                        key={notif.id.toString()}
                        kind={notif.kind}
                        fromProfile={fromProfile}
                        fromPrincipal={notif.fromUser}
                        createdAt={notif.createdAt}
                        index={i}
                        onFollow={() => handleFollowBack(notif.fromUser)}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <BottomDock />
    </div>
  );
}

function NotificationRow({
  kind,
  fromProfile,
  fromPrincipal,
  createdAt,
  index,
  isNew,
  onFollow,
}: {
  kind: string;
  fromProfile?: UserProfile;
  fromPrincipal: unknown;
  createdAt: bigint;
  index: number;
  isNew?: boolean;
  onFollow: () => void;
}) {
  const principalStr = String(fromPrincipal);
  const { data: alreadyFollowing = false } = useIsFollowing(fromPrincipal);
  const username = fromProfile?.username || `${principalStr.slice(0, 8)}...`;
  const avatarUrl = fromProfile?.avatarUrl || "";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 px-4 py-3 ${
        isNew ? "bg-accent/10" : ""
      } border-b border-border last:border-b-0`}
      data-ocid={`notifications.item.${index + 1}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-accent text-xs">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-0.5">
          <NotificationIcon kind={kind} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug">
          <span className="font-semibold">{username}</span>{" "}
          <span className="text-foreground">{actionText(kind)}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {timeAgo(createdAt)}
        </p>
      </div>

      {isNew && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}

      {kind === "follow" && (
        <button
          type="button"
          className={`text-[12px] font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ml-1 ${
            alreadyFollowing
              ? "bg-secondary text-foreground border border-border"
              : "text-primary border border-primary hover:bg-primary hover:text-primary-foreground"
          }`}
          onClick={onFollow}
          disabled={alreadyFollowing}
          data-ocid={`notifications.follow.${index + 1}`}
        >
          {alreadyFollowing ? "Following" : "Follow"}
        </button>
      )}
    </motion.div>
  );
}
