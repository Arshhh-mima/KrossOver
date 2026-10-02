import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllUsers,
  useBlockUser,
  useDeletePost,
  useIsBlocked,
  useIsLiked,
  useIsMuted,
  useMuteUser,
  usePostLikeCount,
  useSearchUsers,
  useSendMessage,
  useToggleLike,
  useToggleSave,
  useUnblockUser,
  useUnmuteUser,
} from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { Post, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Send,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23555'%3EMedia unavailable%3C/text%3E%3C/svg%3E";

function getPostMedia(post: Post): string[] {
  const urls: string[] = [];
  if (post.imageUrls && post.imageUrls.length > 0) {
    for (const u of post.imageUrls) {
      urls.push(u && u.length > 4 ? u : PLACEHOLDER_IMG);
    }
    return urls;
  }
  if (post.imageUrl && post.imageUrl.length > 4) return [post.imageUrl];
  return [PLACEHOLDER_IMG];
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(url);
}

type PostCardProps = {
  post: Post;
  authorProfile?: UserProfile | null;
  index?: number;
  onPostClick?: (post: Post) => void;
};

function VideoPlayer({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-square object-cover"
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <track kind="captions" />
      </video>
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {!playing && (
          <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        )}
      </button>
    </div>
  );
}

function PostOptionsMenu({
  index,
  isOwnPost,
  authorId,
  username,
  onDelete,
  onCopyLink,
  onReport,
}: {
  index: number;
  isOwnPost: boolean;
  authorId: unknown;
  username: string;
  onDelete: (e: React.MouseEvent) => void;
  onCopyLink: (e: React.MouseEvent) => void;
  onReport: (e: React.MouseEvent) => void;
}) {
  const { data: isMuted = false } = useIsMuted(isOwnPost ? null : authorId);
  const { data: isBlocked = false } = useIsBlocked(isOwnPost ? null : authorId);
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const handleMuteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isMuted) {
        await unmuteUser.mutateAsync(authorId);
        toast.success(`Unmuted @${username}`);
      } else {
        await muteUser.mutateAsync(authorId);
        toast.success(`Muted @${username}. Their posts will be hidden.`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleBlockToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isBlocked) {
        await unblockUser.mutateAsync(authorId);
        toast.success(`Unblocked @${username}`);
      } else {
        await blockUser.mutateAsync(authorId);
        toast.success(`Blocked @${username}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Post options"
          data-ocid={`post.options.${index + 1}`}
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem
          onClick={onCopyLink}
          className="gap-2 cursor-pointer"
          data-ocid={`post.copy_link.${index + 1}`}
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        {isOwnPost ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              data-ocid={`post.delete_button.${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleMuteToggle}
              className="gap-2 cursor-pointer"
              data-ocid={`post.mute.${index + 1}`}
            >
              {isMuted ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  Unmute @{username}
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Mute @{username}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleBlockToggle}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              data-ocid={`post.block.${index + 1}`}
            >
              {isBlocked ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Unblock @{username}
                </>
              ) : (
                <>
                  <ShieldBan className="h-4 w-4" />
                  Block @{username}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onReport}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              data-ocid={`post.report.${index + 1}`}
            >
              <Flag className="h-4 w-4" />
              Report
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PostCard({
  post,
  authorProfile,
  index = 0,
  onPostClick,
}: PostCardProps) {
  const { identity } = useInternetIdentity();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const deletePost = useDeletePost();
  const { data: isLiked = false } = useIsLiked(post.id);
  const { data: likeCountBig = BigInt(0) } = usePostLikeCount(post.id);
  const likeCount = Number(likeCountBig);
  const [showHeart, setShowHeart] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const isOwnPost =
    identity && post.author.toString() === identity.getPrincipal().toString();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard");
    });
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Post reported. We'll review it shortly.");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) return;
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: () => toast.error("Failed to delete post"),
    });
  };

  const media = useMemo(() => getPostMedia(post), [post]);
  const isCarousel = media.length > 1;
  const currentMedia = media[carouselIdx] ?? PLACEHOLDER_IMG;
  const currentIsVideo = isVideoUrl(currentMedia);

  const displayName =
    authorProfile?.displayName ||
    authorProfile?.username ||
    `${post.author.toString().slice(0, 8)}...`;
  const username =
    authorProfile?.username || `${post.author.toString().slice(0, 8)}...`;
  const avatarUrl = authorProfile?.avatarUrl || "";

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) return;
    toggleLike.mutate(post.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) return;
    setIsSavedLocal((p) => !p);
    toggleSave.mutate(post.id);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIdx((i) => (i > 0 ? i - 1 : media.length - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIdx((i) => (i < media.length - 1 ? i + 1 : 0));
  };

  const handleDoubleClick = () => {
    if (!identity) return;
    if (!isLiked) toggleLike.mutate(post.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.08 }}
        className="bg-card rounded-2xl card-shadow mb-4 overflow-hidden"
        data-ocid={`post.item.${index + 1}`}
      >
        {/* Author header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="story-ring cursor-pointer">
              <div className="story-inner">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div>
              <p className="font-semibold text-[14px] text-foreground leading-tight">
                {username}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <PostOptionsMenu
            index={index}
            isOwnPost={!!isOwnPost}
            authorId={post.author}
            username={username}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
            onReport={handleReport}
          />
        </div>

        {post.caption && (
          <p className="px-4 pb-2 text-[14px] leading-relaxed text-foreground">
            {post.caption}
          </p>
        )}

        {/* Media area */}
        <div className="relative">
          {currentIsVideo ? (
            <div onDoubleClick={handleDoubleClick}>
              <VideoPlayer src={currentMedia} />
            </div>
          ) : (
            <button
              type="button"
              className="relative w-full cursor-pointer bg-secondary block"
              onDoubleClick={handleDoubleClick}
              onClick={() => onPostClick?.(post)}
              aria-label="View post"
            >
              <img
                src={currentMedia}
                alt={post.caption || "Post"}
                className="w-full aspect-square object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
                }}
              />
              <AnimatePresence>
                {showHeart && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart className="h-20 w-20 text-white fill-white drop-shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Carousel navigation */}
          {isCarousel && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                aria-label="Previous"
                data-ocid={`post.carousel_prev.${index + 1}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                aria-label="Next"
                data-ocid={`post.carousel_next.${index + 1}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {media.map((url, dotIdx) => (
                  <span
                    key={url}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      dotIdx === carouselIdx
                        ? "w-3 bg-white"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                className="p-1 -m-1 hover:scale-110 transition-transform"
                aria-label={isLiked ? "Unlike post" : "Like post"}
                data-ocid={`post.toggle.${index + 1}`}
              >
                <Heart
                  className={`h-6 w-6 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`}
                />
              </button>
              <button
                type="button"
                onClick={() => onPostClick?.(post)}
                className="p-1 -m-1 hover:scale-110 transition-transform"
                aria-label="View comments"
                data-ocid={`post.comment.${index + 1}`}
              >
                <MessageCircle className="h-6 w-6 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="p-1 -m-1 hover:scale-110 transition-transform"
                aria-label="Share post"
                data-ocid={`post.share.${index + 1}`}
              >
                <Send className="h-6 w-6 text-foreground" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="p-1 -m-1 hover:scale-110 transition-transform"
              aria-label={isSavedLocal ? "Unsave post" : "Save post"}
              data-ocid={`post.save.${index + 1}`}
            >
              <Bookmark
                className={`h-6 w-6 transition-colors ${isSavedLocal ? "fill-foreground text-foreground" : "text-foreground"}`}
              />
            </button>
          </div>

          <p className="text-[13px] font-semibold text-foreground mb-1">
            {likeCount.toLocaleString()} likes
          </p>
          <button
            type="button"
            onClick={() => onPostClick?.(post)}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            View comments
          </button>

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-primary font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.article>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={post.id}
      />
    </>
  );
}

function ShareDialog({
  open,
  onClose,
  postId,
}: { open: boolean; onClose: () => void; postId: bigint }) {
  const [query, setQuery] = useState("");
  const { data: users = [] } = useSearchUsers(query);
  const sendMessage = useSendMessage();
  const { data: allUsers = [] } = useAllUsers();
  const { identity } = useInternetIdentity();

  const displayUsers = query.trim()
    ? users
    : allUsers.filter(
        (u) =>
          identity && u.id.toString() !== identity.getPrincipal().toString(),
      );

  const handleSend = async (toUser: UserProfile) => {
    try {
      await sendMessage.mutateAsync({
        toUser: toUser.id,
        text: `Check out this post! [post:${postId.toString()}]`,
      });
      toast.success(`Sent to ${toUser.username}`);
      onClose();
    } catch {
      toast.error("Failed to send");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        data-ocid="post.share.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-[16px]">
            Share Post
          </DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-xl"
          data-ocid="post.share.search_input"
        />
        <ScrollArea className="max-h-64">
          {displayUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-[13px] py-6">
              No users found
            </p>
          ) : (
            <div className="space-y-2">
              {displayUsers.map((u) => (
                <div
                  key={u.id.toString()}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatarUrl} alt={u.username} />
                      <AvatarFallback className="bg-accent text-xs">
                        {u.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-medium">
                      {u.username}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="gold-btn rounded-full text-[12px] h-7"
                    onClick={() => handleSend(u)}
                    disabled={sendMessage.isPending}
                    data-ocid="post.share.send_button"
                  >
                    Send
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl card-shadow mb-4 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
        </div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
