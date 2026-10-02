import { BottomDock, Header } from "@/components/Navigation";
import { PostDetailModal } from "@/components/PostDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllUsers,
  useExploreFeed,
  useFollowUser,
  useIsFollowing,
  useSearchByHashtag,
  useSearchUsers,
  useTrendingHashtags,
} from "@/hooks/useQueries";
import type { Post, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Hash, Heart, Search, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function ExplorePage() {
  const { identity } = useInternetIdentity();
  const [query, setQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const { data: explorePosts = [], isLoading: postsLoading } = useExploreFeed();
  const { data: allUsers = [] } = useAllUsers();
  const { data: searchResults = [] } = useSearchUsers(query);
  const { data: trendingTagsRaw = [], isLoading: trendingLoading } =
    useTrendingHashtags(10);
  // trendingTagsRaw is [string, bigint][] — extract just the tag strings
  const trendingTags = trendingTagsRaw.map(([tag]) => tag);
  const { data: hashtagPosts = [], isLoading: hashtagLoading } =
    useSearchByHashtag(activeHashtag ?? "");
  const followUser = useFollowUser();

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  const selectedAuthor = selectedPost
    ? (profileMap.get(selectedPost.author.toString()) ?? null)
    : null;

  const myPrincipal = identity?.getPrincipal().toString();

  const suggestedUsers = allUsers
    .filter((u) => u.id.toString() !== myPrincipal)
    .slice(0, 10);

  const handleFollow = async (user: UserProfile) => {
    if (!identity) {
      toast.error("Sign in to follow users");
      return;
    }
    try {
      await followUser.mutateAsync(user.id);
      toast.success(`Following ${user.username}`);
    } catch {
      toast.error("Action failed");
    }
  };

  const displayPosts = activeHashtag ? hashtagPosts : explorePosts;
  const displayLoading = activeHashtag ? hashtagLoading : postsLoading;

  return (
    <div className="page-bg min-h-screen" data-ocid="explore.page">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-28">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveHashtag(null);
            }}
            placeholder="Search users, hashtags..."
            className="pl-10 rounded-xl bg-card border-border text-[14px]"
            data-ocid="explore.search_input"
          />
        </div>

        {/* Search results panel */}
        {query && (
          <div
            className="bg-card rounded-2xl card-shadow mb-6 overflow-hidden"
            data-ocid="explore.search.list"
          >
            {searchResults.length === 0 ? (
              <div
                className="p-6 text-center"
                data-ocid="explore.search.empty_state"
              >
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-[14px]">
                  No users found for "{query}"
                </p>
              </div>
            ) : (
              <div>
                {searchResults.map((user, i) => (
                  <SearchUserRow
                    key={user.id.toString()}
                    user={user}
                    index={i}
                    myPrincipal={myPrincipal}
                    identity={identity}
                    onFollow={() => handleFollow(user)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending Hashtags (when no search) */}
        {!query && (
          <div className="mb-6" data-ocid="explore.trending.section">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="font-semibold text-[14px] text-foreground">
                Trending
              </p>
            </div>
            {trendingLoading ? (
              <div className="flex gap-2 flex-wrap">
                {[...Array(6)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey:
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            ) : trendingTags.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {trendingTags.map((tag, i) => {
                  const isActive = activeHashtag === tag;
                  const isTop = i < 3;
                  return (
                    <motion.button
                      key={tag}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setActiveHashtag(isActive ? null : tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : isTop
                            ? "bg-primary/15 text-primary border-primary/40 hover:bg-primary/25"
                            : "bg-secondary text-foreground border-border hover:border-primary/40 hover:text-primary"
                      }`}
                      data-ocid={`explore.trending.item.${i + 1}`}
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No trending hashtags yet
              </p>
            )}
          </div>
        )}

        {/* Active hashtag heading */}
        {activeHashtag && !query && (
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-primary" />
            <p className="font-semibold text-[15px] text-foreground">
              #{activeHashtag}
            </p>
            <button
              type="button"
              onClick={() => setActiveHashtag(null)}
              className="text-[12px] text-muted-foreground hover:text-foreground ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Suggested people (when no search and no hashtag filter) */}
        {!query && !activeHashtag && suggestedUsers.length > 0 && (
          <div className="mb-6">
            <p className="font-semibold text-[14px] text-foreground mb-3">
              People on KrossOver
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {suggestedUsers.map((user, i) => (
                <SuggestedUserCard
                  key={user.id.toString()}
                  user={user}
                  index={i}
                  myPrincipal={myPrincipal}
                  identity={identity}
                  onFollow={() => handleFollow(user)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts grid */}
        {!query && (
          <div data-ocid="explore.grid.section">
            {displayLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {[...Array(9)].map((_, n) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey:
                  <Skeleton key={n} className="aspect-square" />
                ))}
              </div>
            ) : displayPosts.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="explore.grid.empty_state"
              >
                <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">
                  {activeHashtag
                    ? `No posts for #${activeHashtag}`
                    : "No posts yet"}
                </p>
                <p className="text-muted-foreground text-[14px]">
                  {activeHashtag
                    ? "Try a different hashtag"
                    : "Be the first to post something!"}
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden"
                data-ocid="explore.grid"
              >
                {displayPosts.map((post, i) => (
                  <motion.button
                    key={post.id.toString()}
                    type="button"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square group overflow-hidden bg-secondary"
                    data-ocid={`explore.grid.item.${i + 1}`}
                  >
                    {post.imageUrls && post.imageUrls.length > 1 && (
                      <div className="absolute top-2 right-2 z-10 bg-black/60 rounded-full p-1">
                        <svg
                          className="h-3 w-3 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M2 5h16v14H2V5zm18-2v16h2V3h-2zm-4-2v16h2V1h-2z" />
                        </svg>
                      </div>
                    )}
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white">
                        <Heart className="h-5 w-5 fill-white" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomDock />

      <PostDetailModal
        post={selectedPost}
        authorProfile={selectedAuthor}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}

function SearchUserRow({
  user,
  index,
  myPrincipal,
  identity,
  onFollow,
}: {
  user: UserProfile;
  index: number;
  myPrincipal: string | undefined;
  identity: ReturnType<typeof useInternetIdentity>["identity"];
  onFollow: () => void;
}) {
  const { data: alreadyFollowing = false } = useIsFollowing(
    identity ? user.id : null,
  );

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
      data-ocid={`explore.search.item.${index + 1}`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
        <AvatarFallback className="bg-accent text-xs">
          {user.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] truncate">{user.username}</p>
        <p className="text-[12px] text-muted-foreground truncate">
          {user.displayName}
        </p>
      </div>
      {identity && user.id.toString() !== myPrincipal && (
        <button
          type="button"
          className={`text-[12px] font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
            alreadyFollowing
              ? "bg-secondary text-foreground border border-border"
              : "text-primary border border-primary hover:bg-primary hover:text-primary-foreground"
          }`}
          onClick={onFollow}
          disabled={alreadyFollowing}
          data-ocid={`explore.follow.${index + 1}`}
        >
          {alreadyFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

function SuggestedUserCard({
  user,
  index,
  myPrincipal,
  identity,
  onFollow,
}: {
  user: UserProfile;
  index: number;
  myPrincipal: string | undefined;
  identity: ReturnType<typeof useInternetIdentity>["identity"];
  onFollow: () => void;
}) {
  const { data: alreadyFollowing = false } = useIsFollowing(
    identity ? user.id : null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-2xl card-shadow p-4 flex flex-col items-center gap-2 min-w-[140px] flex-shrink-0"
      data-ocid={`explore.user.item.${index + 1}`}
    >
      <Avatar className="h-14 w-14 ring-2 ring-border">
        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
        <AvatarFallback className="bg-accent">
          {user.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p className="font-semibold text-[13px] text-center truncate w-full">
        {user.username}
      </p>
      <p className="text-[11px] text-muted-foreground text-center truncate w-full">
        {user.displayName}
      </p>
      {identity && user.id.toString() !== myPrincipal && (
        <button
          type="button"
          className={`text-[12px] font-semibold px-3 py-1 rounded-full transition-colors mt-1 ${
            alreadyFollowing
              ? "bg-secondary text-foreground border border-border"
              : "text-primary hover:text-primary/80"
          }`}
          onClick={onFollow}
          disabled={alreadyFollowing}
          data-ocid={`explore.user.follow.${index + 1}`}
        >
          {alreadyFollowing ? "Following" : "Follow"}
        </button>
      )}
    </motion.div>
  );
}
