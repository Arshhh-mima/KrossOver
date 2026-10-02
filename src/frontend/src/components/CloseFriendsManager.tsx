import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddToCloseFriends,
  useAllUsers,
  useCloseFriends,
  useFollowers,
  useRemoveFromCloseFriends,
} from "@/hooks/useQueries";
import type { UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Star, StarOff, UserCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface CloseFriendsManagerProps {
  myPrincipal: unknown;
}

export function CloseFriendsManager({ myPrincipal }: CloseFriendsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { identity } = useInternetIdentity();
  const { data: closeFriendPrincipals = [], isLoading } = useCloseFriends();
  const { data: followersList = [] } = useFollowers(myPrincipal);
  const { data: allUsers = [] } = useAllUsers();
  const addMutation = useAddToCloseFriends();
  const removeMutation = useRemoveFromCloseFriends();

  const closeFriendSet = useMemo(
    () => new Set(closeFriendPrincipals.map((p) => String(p))),
    [closeFriendPrincipals],
  );

  const userMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  const followerProfiles = useMemo(
    () =>
      followersList
        .map((f) => userMap.get(String(f)))
        .filter((u): u is UserProfile => !!u)
        .filter(
          (u) =>
            !identity || u.id.toString() !== identity.getPrincipal().toString(),
        ),
    [followersList, userMap, identity],
  );

  const currentCloseFriends = useMemo(
    () =>
      closeFriendPrincipals
        .map((p) => userMap.get(String(p)))
        .filter((u): u is UserProfile => !!u),
    [closeFriendPrincipals, userMap],
  );

  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return followerProfiles;
    const q = searchQuery.toLowerCase();
    return followerProfiles.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q),
    );
  }, [followerProfiles, searchQuery]);

  const handleAdd = async (user: UserProfile) => {
    try {
      await addMutation.mutateAsync(user.id);
      toast.success(`${user.username} added to Close Friends`);
    } catch {
      toast.error("Failed to add to Close Friends");
    }
  };

  const handleRemove = async (user: UserProfile) => {
    try {
      await removeMutation.mutateAsync(user.id);
      toast.success(`${user.username} removed from Close Friends`);
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="space-y-4" data-ocid="close_friends.panel">
      {/* Current close friends */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <span className="text-[13px] font-semibold text-foreground">
            Close Friends
          </span>
          <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
            {closeFriendPrincipals.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : currentCloseFriends.length === 0 ? (
          <div
            className="text-center py-4 rounded-xl bg-secondary/40"
            data-ocid="close_friends.empty_state"
          >
            <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-[12px] text-muted-foreground">
              No close friends yet
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Add followers to share exclusive content with them
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentCloseFriends.map((user, i) => (
              <div
                key={user.id.toString()}
                className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full pl-1 pr-2 py-0.5"
                data-ocid={`close_friends.current.item.${i + 1}`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                  <AvatarFallback className="bg-accent text-[10px]">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] font-medium text-foreground">
                  {user.username}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(user)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${user.username} from close friends`}
                  data-ocid={`close_friends.remove_button.${i + 1}`}
                >
                  <StarOff className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add from followers */}
      <div>
        <p className="text-[13px] font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Add from followers
        </p>
        <Input
          placeholder="Search followers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl text-[13px] mb-2"
          data-ocid="close_friends.search_input"
        />
        <ScrollArea className="max-h-52">
          {followerProfiles.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-4">
              No followers yet. People who follow you will appear here.
            </p>
          ) : filteredFollowers.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-3">
              No matching followers for "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-1">
              {filteredFollowers.map((user, i) => {
                const isCF = closeFriendSet.has(user.id.toString());
                return (
                  <div
                    key={user.id.toString()}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50 transition-colors"
                    data-ocid={`close_friends.follower.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback className="bg-accent text-[11px]">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold leading-tight truncate">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                          {user.displayName}
                        </p>
                      </div>
                    </div>
                    {isCF ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] rounded-full border-primary/40 text-primary flex-shrink-0"
                        onClick={() => handleRemove(user)}
                        disabled={removeMutation.isPending}
                        data-ocid={`close_friends.remove_button.${i + 1}`}
                      >
                        <Star className="h-3 w-3 fill-primary mr-1" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] rounded-full gold-btn flex-shrink-0"
                        onClick={() => handleAdd(user)}
                        disabled={addMutation.isPending}
                        data-ocid={`close_friends.add_button.${i + 1}`}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
