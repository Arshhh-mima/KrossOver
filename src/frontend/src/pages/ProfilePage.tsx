import { CloseFriendsManager } from "@/components/CloseFriendsManager";
import { HighlightsRow } from "@/components/HighlightsRow";
import { BottomDock, Header } from "@/components/Navigation";
import { PostDetailModal } from "@/components/PostDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useActivityStatus,
  useAllUsers,
  useBlockUser,
  useFollowUser,
  useFollowers,
  useFollowing,
  useIsBlocked,
  useIsFollowing,
  useMyProfile,
  usePinPost,
  usePinnedPosts,
  useProfile,
  useSavedPosts,
  useUnblockUser,
  useUnfollowUser,
  useUnpinPost,
  useUpdateProfile,
  useUserPosts,
} from "@/hooks/useQueries";
import { useStorageClient } from "@/hooks/useStorageClient";
import type { ActivityStatus, Post, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useParams } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Bookmark as BookmarkIcon,
  Camera,
  Clapperboard,
  Grid3X3,
  Loader2,
  MoreHorizontal,
  Pin,
  PinOff,
  Play,
  Settings,
  ShieldBan,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

function formatActivityStatus(status: ActivityStatus | null | undefined): {
  label: string;
  isOnline: boolean;
} {
  if (!status) return { label: "", isOnline: false };
  if (status.isOnline) return { label: "Active now", isOnline: true };
  const ms = Number(status.lastSeen / BigInt(1_000_000));
  if (ms <= 0) return { label: "", isOnline: false };
  const label = `Active ${formatDistanceToNow(new Date(ms), { addSuffix: true })}`;
  return { label, isOnline: false };
}

// Thumbnail for a post — supports both images and videos
function PostThumbnail({
  post,
  className = "",
}: {
  post: Post;
  className?: string;
}) {
  const primaryUrl = post.imageUrls?.[0] || post.imageUrl;
  const isVideo = isVideoUrl(primaryUrl);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isVideo ? (
        <>
          <video
            src={primaryUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-2">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
          <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-sm px-1 py-0.5 flex items-center gap-0.5">
            <Clapperboard className="h-2.5 w-2.5" />
          </div>
        </>
      ) : (
        <img
          src={primaryUrl}
          alt={post.caption}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      )}
      {(post.imageUrls?.length ?? 0) > 1 && !isVideo && (
        <div className="absolute top-1.5 right-1.5">
          <div className="bg-black/60 rounded-sm p-0.5">
            <Grid3X3 className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// Context menu for post grid items (own profile only)
function PostContextMenu({
  post,
  isPinned,
  onPin,
  onUnpin,
}: {
  post: Post;
  isPinned: boolean;
  onPin: (post: Post) => void;
  onUnpin: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={menuRef} className="absolute top-1.5 right-1.5 z-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Post options"
        data-ocid="post.options.button"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-card border border-border rounded-xl shadow-lg py-1 w-36 z-30">
          {isPinned ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onUnpin(post);
              }}
              className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-secondary flex items-center gap-2"
              data-ocid="post.unpin_button"
            >
              <PinOff className="h-3.5 w-3.5" />
              Unpin post
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onPin(post);
              }}
              className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-secondary flex items-center gap-2"
              data-ocid="post.pin_button"
            >
              <Pin className="h-3.5 w-3.5" />
              Pin post
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const params = useParams({ strict: false }) as { userId?: string };
  const { userId } = params;
  const { identity, login } = useInternetIdentity();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: myProfile } = useMyProfile();
  const { data: otherProfile, isLoading: otherLoading } = useProfile(userId);
  const { data: allUsers = [] } = useAllUsers();

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  const isOwnProfile = !userId;
  const profile = isOwnProfile ? myProfile : otherProfile;
  const profilePrincipal = profile?.id ?? null;

  const { data: activityStatus } = useActivityStatus(
    !isOwnProfile ? profilePrincipal : undefined,
  );
  const activityInfo = formatActivityStatus(activityStatus);

  const { data: posts = [], isLoading: postsLoading } =
    useUserPosts(profilePrincipal);
  const { data: pinnedPosts = [] } = usePinnedPosts(profilePrincipal);
  const { data: savedPosts = [] } = useSavedPosts();
  const { data: followersList = [] } = useFollowers(profilePrincipal);
  const { data: followingList = [] } = useFollowing(profilePrincipal);
  const { data: isFollowingThem = false } = useIsFollowing(
    isOwnProfile ? null : profilePrincipal,
  );
  const { data: isBlockedThem = false } = useIsBlocked(
    isOwnProfile ? null : profilePrincipal,
  );
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const pinPost = usePinPost();
  const unpinPost = useUnpinPost();

  const pinnedPostIds = useMemo(
    () => new Set(pinnedPosts.map((p) => p.id.toString())),
    [pinnedPosts],
  );

  const unpinnedPosts = useMemo(
    () => posts.filter((p) => !pinnedPostIds.has(p.id.toString())),
    [posts, pinnedPostIds],
  );

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (isFollowingThem) {
        await unfollowUser.mutateAsync(profile.id);
      } else {
        await followUser.mutateAsync(profile.id);
        toast.success(`Following ${profile.username}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleBlockToggle = async () => {
    if (!profile) return;
    try {
      if (isBlockedThem) {
        await unblockUser.mutateAsync(profile.id);
        toast.success(`Unblocked ${profile.username}`);
      } else {
        await blockUser.mutateAsync(profile.id);
        toast.success(`Blocked ${profile.username}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handlePin = async (post: Post) => {
    try {
      const result = await pinPost.mutateAsync(post.id);
      if (result && "err" in result) {
        toast.error(result.err ?? "Could not pin post (max 3 reached)");
      } else {
        toast.success("Post pinned!");
      }
    } catch {
      toast.error("Failed to pin post");
    }
  };

  const handleUnpin = async (post: Post) => {
    try {
      await unpinPost.mutateAsync(post.id);
      toast.success("Post unpinned");
    } catch {
      toast.error("Failed to unpin post");
    }
  };

  const selectedAuthor = selectedPost
    ? (profileMap.get(selectedPost.author.toString()) ?? null)
    : null;

  // Count videos and posts
  const videoPosts = useMemo(
    () => posts.filter((p) => isVideoUrl(p.imageUrls?.[0] || p.imageUrl)),
    [posts],
  );

  if (!identity && isOwnProfile) {
    return (
      <div className="page-bg min-h-screen" data-ocid="profile.page">
        <Header />
        <main
          className="max-w-lg mx-auto px-4 pt-16 pb-28 text-center"
          data-ocid="profile.empty_state"
        >
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarFallback className="bg-accent text-2xl">?</AvatarFallback>
          </Avatar>
          <h2 className="text-[20px] font-bold text-foreground mb-2">
            Your Profile
          </h2>
          <p className="text-muted-foreground text-[14px] mb-6">
            Sign in to see your profile, posts, and followers.
          </p>
          <Button
            onClick={login}
            className="gold-btn px-6 py-2 rounded-full font-semibold"
            data-ocid="profile.login.primary_button"
          >
            Sign In
          </Button>
        </main>
        <BottomDock />
      </div>
    );
  }

  if (!profile && !isOwnProfile && !otherLoading) {
    return (
      <div className="page-bg min-h-screen" data-ocid="profile.page">
        <Header />
        <main className="max-w-lg mx-auto px-4 pt-16 pb-28 text-center">
          <h2 className="text-[20px] font-bold text-foreground mb-2">
            User not found
          </h2>
        </main>
        <BottomDock />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-bg min-h-screen" data-ocid="profile.page">
        <Header />
        <main className="max-w-3xl mx-auto px-4 pt-6 pb-28">
          <div className="bg-card rounded-2xl card-shadow p-6 mb-4">
            <div className="flex items-start gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-6">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomDock />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen" data-ocid="profile.page">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-28">
        <div className="bg-card rounded-2xl card-shadow p-6 mb-4">
          <div className="flex items-start gap-6">
            {/* Avatar with activity status ring */}
            <div className="relative flex-shrink-0">
              <div className="story-ring">
                <div className="story-inner">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                    />
                    <AvatarFallback className="bg-accent text-xl">
                      {profile.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Activity status dot */}
              {!isOwnProfile && activityInfo.isOnline && (
                <span
                  className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-card"
                  data-ocid="profile.online_dot"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-[20px] font-bold text-foreground">
                  {profile.username}
                </h1>
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-[13px]"
                    onClick={() => setEditOpen(true)}
                    data-ocid="profile.edit.secondary_button"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className={`rounded-xl text-[13px] ${isFollowingThem ? "variant-outline border" : "gold-btn"}`}
                      onClick={handleFollowToggle}
                      disabled={followUser.isPending || unfollowUser.isPending}
                      data-ocid="profile.follow.primary_button"
                    >
                      {followUser.isPending || unfollowUser.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isFollowingThem ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`rounded-xl text-[13px] ${isBlockedThem ? "border-green-600 text-green-600 hover:bg-green-600/10" : "border-destructive text-destructive hover:bg-destructive/10"}`}
                      onClick={handleBlockToggle}
                      disabled={blockUser.isPending || unblockUser.isPending}
                      data-ocid="profile.block.button"
                    >
                      {blockUser.isPending || unblockUser.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isBlockedThem ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <ShieldBan className="h-3.5 w-3.5 mr-1" />
                          Block
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {!isOwnProfile && activityInfo.label && (
                <p
                  className={`text-[12px] font-medium mb-2 flex items-center gap-1.5 ${
                    activityInfo.isOnline
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                  data-ocid="profile.activity_status"
                >
                  {activityInfo.isOnline && (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                  {activityInfo.label}
                </p>
              )}

              <div className="flex gap-6 mb-3">
                <div className="text-center">
                  <p className="font-bold text-[15px] text-foreground">
                    {posts.length}
                  </p>
                  <p className="text-[12px] text-muted-foreground">posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[15px] text-foreground">
                    {videoPosts.length}
                  </p>
                  <p className="text-[12px] text-muted-foreground">videos</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[15px] text-foreground">
                    {followersList.length}
                  </p>
                  <p className="text-[12px] text-muted-foreground">followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[15px] text-foreground">
                    {followingList.length}
                  </p>
                  <p className="text-[12px] text-muted-foreground">following</p>
                </div>
              </div>

              <p className="font-semibold text-[14px] text-foreground">
                {profile.displayName}
              </p>
              {profile.bio && (
                <p className="text-[13px] text-foreground/80 mt-0.5">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Story Highlights */}
        {profilePrincipal && (
          <div className="bg-card rounded-2xl card-shadow px-4 py-2 mb-4">
            <HighlightsRow
              profilePrincipal={profilePrincipal}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}

        <Tabs defaultValue="posts" data-ocid="profile.tabs">
          <TabsList className="w-full bg-card rounded-2xl card-shadow mb-4 p-1">
            <TabsTrigger
              value="posts"
              className="flex-1 gap-1.5 rounded-xl"
              data-ocid="profile.posts.tab"
            >
              <Grid3X3 className="h-4 w-4" /> Posts
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="flex-1 gap-1.5 rounded-xl"
              data-ocid="profile.reels.tab"
            >
              <Clapperboard className="h-4 w-4" /> Videos
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="saved"
                className="flex-1 gap-1.5 rounded-xl"
                data-ocid="profile.saved.tab"
              >
                <BookmarkIcon className="h-4 w-4" /> Saved
              </TabsTrigger>
            )}
          </TabsList>

          {/* All Posts Tab */}
          <TabsContent value="posts">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Skeleton key={n} className="aspect-square" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="profile.posts.empty_state"
              >
                <Grid3X3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-[14px]">
                  No posts yet
                </p>
              </div>
            ) : (
              <div data-ocid="profile.posts.grid">
                {/* Pinned section */}
                {pinnedPosts.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Pinned
                      </span>
                    </div>
                    <div
                      className="grid grid-cols-3 gap-0.5 mb-3"
                      data-ocid="profile.pinned.grid"
                    >
                      {pinnedPosts.map((post, i) => (
                        <motion.button
                          key={post.id.toString()}
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedPost(post)}
                          className="relative aspect-square overflow-hidden bg-secondary group"
                          data-ocid={`profile.pinned.item.${i + 1}`}
                        >
                          <PostThumbnail post={post} />
                          {/* Pin badge */}
                          <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-0.5">
                            <Pin className="h-3 w-3" />
                          </div>
                          {isOwnProfile && (
                            <PostContextMenu
                              post={post}
                              isPinned
                              onPin={handlePin}
                              onUnpin={handleUnpin}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    {unpinnedPosts.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Posts
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Non-pinned posts */}
                <div className="grid grid-cols-3 gap-0.5">
                  {unpinnedPosts.map((post, i) => (
                    <motion.button
                      key={post.id.toString()}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedPost(post)}
                      className="relative aspect-square overflow-hidden bg-secondary group"
                      data-ocid={`profile.posts.item.${i + 1}`}
                    >
                      <PostThumbnail post={post} />
                      {isOwnProfile && (
                        <PostContextMenu
                          post={post}
                          isPinned={false}
                          onPin={handlePin}
                          onUnpin={handleUnpin}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Videos/Reels Tab */}
          <TabsContent value="reels">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="aspect-[9/16]" />
                ))}
              </div>
            ) : videoPosts.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="profile.reels.empty_state"
              >
                <Clapperboard className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-[14px]">
                  No videos yet
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Upload a video post to see it here
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-3 gap-0.5"
                data-ocid="profile.reels.grid"
              >
                {videoPosts.map((post, i) => (
                  <motion.button
                    key={post.id.toString()}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-[9/16] overflow-hidden bg-secondary group"
                    data-ocid={`profile.reels.item.${i + 1}`}
                  >
                    <video
                      src={post.imageUrls?.[0] || post.imageUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="bg-black/50 rounded-full p-3">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                    {post.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-[10px] line-clamp-2">
                          {post.caption}
                        </p>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved">
              {savedPosts.length === 0 ? (
                <div
                  className="py-16 text-center"
                  data-ocid="profile.saved.empty_state"
                >
                  <BookmarkIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-[14px]">
                    No saved posts yet
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-3 gap-0.5"
                  data-ocid="profile.saved.grid"
                >
                  {savedPosts.map((post, i) => (
                    <motion.button
                      key={post.id.toString()}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedPost(post)}
                      className="relative aspect-square overflow-hidden bg-secondary group"
                      data-ocid={`profile.saved.item.${i + 1}`}
                    >
                      <PostThumbnail post={post} />
                    </motion.button>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      <BottomDock />

      <PostDetailModal
        post={selectedPost}
        authorProfile={selectedAuthor}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      {isOwnProfile && profile && (
        <EditProfileDialog
          profile={profile}
          myPrincipal={profilePrincipal}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function EditProfileDialog({
  profile,
  myPrincipal,
  open,
  onClose,
}: {
  profile: UserProfile;
  myPrincipal: unknown;
  open: boolean;
  onClose: () => void;
}) {
  const updateProfile = useUpdateProfile();
  const { upload: storageUpload, waitUntilReady } = useStorageClient();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "profile" | "closefriends"
  >("profile");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      // Wait for the platform's managed StorageClient to be ready.
      // This avoids 403 "Invalid payload" caused by a separately-created
      // HttpAgent whose delegation chain hasn't initialised yet.
      try {
        await waitUntilReady(15_000);
      } catch {
        toast.error(
          "Storage is still loading — please wait a moment and try again.",
        );
        return;
      }

      const { url } = await storageUpload(file);
      setAvatarUrl(url);
      toast.success("Avatar uploaded!");
    } catch (err) {
      console.error("[AvatarUpload] failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Avatar upload failed — please try again";
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ displayName, bio, avatarUrl });
      toast.success("Profile updated!");
      onClose();
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {/* Section switcher */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-1">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-1.5 rounded-lg transition-colors ${
              activeSection === "profile"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="edit_profile.profile.tab"
          >
            <Settings className="h-3.5 w-3.5" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("closefriends")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-1.5 rounded-lg transition-colors ${
              activeSection === "closefriends"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="edit_profile.closefriends.tab"
          >
            <Star className="h-3.5 w-3.5" />
            Close Friends
          </button>
        </div>

        {activeSection === "profile" ? (
          <div className="space-y-4">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-accent text-xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/80 transition-colors"
                  data-ocid="edit_profile.avatar.upload_button"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tap the camera to upload a new photo
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Avatar URL</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (or upload above)"
                className="rounded-xl text-[12px]"
                data-ocid="edit_profile.avatar.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl"
                data-ocid="edit_profile.display_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                data-ocid="edit_profile.bio.textarea"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
                data-ocid="edit_profile.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gold-btn rounded-xl"
                onClick={handleSave}
                disabled={updateProfile.isPending || isUploadingAvatar}
                data-ocid="edit_profile.save_button"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {myPrincipal ? (
              <CloseFriendsManager myPrincipal={myPrincipal} />
            ) : (
              <div
                className="text-center py-6"
                data-ocid="close_friends.empty_state"
              >
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground">
                  Sign in to manage close friends
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={onClose}
              data-ocid="edit_profile.close_button"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
