import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useAllUsers,
  useFollowUser,
  useFollowing,
  useUnfollowUser,
} from "@/hooks/useQueries";
import type { UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { motion } from "motion/react";
import { toast } from "sonner";

const FOOTER_LINKS = ["About", "Help", "Press", "Privacy", "Terms"];

export function SuggestionsSidebar() {
  const { identity } = useInternetIdentity();
  const { data: allUsers = [] } = useAllUsers();
  const myPrincipal = identity?.getPrincipal();
  const { data: followingList = [] } = useFollowing(myPrincipal ?? null);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const followingSet = new Set(followingList.map((p) => String(p)));

  const suggestions = allUsers
    .filter(
      (u) =>
        myPrincipal &&
        u.id.toString() !== myPrincipal.toString() &&
        !followingSet.has(u.id.toString()),
    )
    .slice(0, 5);

  const handleFollow = async (user: UserProfile) => {
    try {
      if (followingSet.has(user.id.toString())) {
        await unfollowUser.mutateAsync(user.id);
      } else {
        await followUser.mutateAsync(user.id);
        toast.success(`Following ${user.username}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {identity && suggestions.length > 0 && (
          <div className="bg-card rounded-2xl card-shadow p-4">
            <p className="text-[14px] font-semibold text-foreground mb-3">
              Suggestions For You
            </p>
            <div className="space-y-3" data-ocid="suggestions.list">
              {suggestions.map((user, i) => (
                <motion.div
                  key={user.id.toString()}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between"
                  data-ocid={`suggestions.item.${i + 1}`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 ring-1 ring-border">
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.displayName}
                      />
                      <AvatarFallback className="bg-accent text-xs">
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate max-w-[120px]">
                        {user.username}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {user.displayName}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[12px] h-7 px-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full"
                    onClick={() => handleFollow(user)}
                    data-ocid={`suggestions.follow.${i + 1}`}
                  >
                    Follow
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="px-2">
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
            {FOOTER_LINKS.map((link) => (
              <button
                key={link}
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} KrossOver
          </p>
        </div>
      </div>
    </aside>
  );
}
