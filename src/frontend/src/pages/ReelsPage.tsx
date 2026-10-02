import { CreatePostModal } from "@/components/CreatePostModal";
import { BottomDock } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAllUsers,
  useIsLiked,
  usePostLikeCount,
  useReelsFeed,
  useSearchUsers,
  useSendMessage,
  useToggleLike,
} from "@/hooks/useQueries";
import type { Post, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Film,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music,
  Play,
  Plus,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(url);
}

export function ReelsPage() {
  const { identity } = useInternetIdentity();
  const { data: posts = [], isLoading } = useReelsFeed();
  const { data: allUsers = [] } = useAllUsers();
  const toggleLike = useToggleLike();
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [mutedAll, setMutedAll] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-white text-[14px]">Loading reels...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className="bg-black min-h-screen flex items-center justify-center"
        data-ocid="reels.page"
      >
        <div className="text-center text-white px-6">
          <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-[20px] font-bold mb-2">No reels yet</p>
          <p className="text-[14px] opacity-60 mb-6">
            Be the first to share a video!
          </p>
          {identity && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="gold-btn rounded-full px-6 font-semibold gap-2"
              data-ocid="reels.create.primary_button"
            >
              <Plus className="h-4 w-4" /> Upload Reel
            </Button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <BottomDock />
        </div>
        <CreatePostModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          mode="reel"
        />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen" data-ocid="reels.page">
      {/* Mute toggle */}
      <button
        type="button"
        onClick={() => setMutedAll((m) => !m)}
        className="fixed top-4 right-4 z-50 p-2 bg-black/40 rounded-full text-white"
        aria-label={mutedAll ? "Unmute" : "Mute"}
        data-ocid="reels.mute.toggle"
      >
        {mutedAll ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      {/* Create reel FAB — only for logged-in users */}
      {identity && (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
          aria-label="Create reel"
          data-ocid="reels.create.button"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      <div className="flex flex-col snap-y snap-mandatory h-screen overflow-y-scroll scrollbar-hide">
        {posts.map((post, i) => {
          const profile = profileMap.get(post.author.toString());
          const username =
            profile?.username || post.author.toString().slice(0, 8);
          const avatarUrl = profile?.avatarUrl || "";
          return (
            <ReelItem
              key={post.id.toString()}
              post={post}
              username={username}
              avatarUrl={avatarUrl}
              index={i}
              muted={mutedAll}
              onShare={() => setSharePost(post)}
              onLike={() => identity && toggleLike.mutate(post.id)}
            />
          );
        })}
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <BottomDock />
      </div>
      {sharePost && (
        <ReelShareDialog post={sharePost} onClose={() => setSharePost(null)} />
      )}
      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="reel"
      />
    </div>
  );
}

function ReelItem({
  post,
  username,
  avatarUrl,
  index,
  muted,
  onShare,
  onLike,
}: {
  post: Post;
  username: string;
  avatarUrl: string;
  index: number;
  muted: boolean;
  onShare: () => void;
  onLike: () => void;
}) {
  const { data: isLiked = false } = useIsLiked(post.id);
  const { data: likeCountBig = BigInt(0) } = usePostLikeCount(post.id);
  const likeCount = Number(likeCountBig);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const mediaUrl = post.imageUrl;
  const isVideo = isVideoUrl(mediaUrl);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVideo) return;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isVideo) return;
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        v.play();
        setPlaying(true);
      } else {
        v.pause();
        setPlaying(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative h-screen w-full snap-start flex items-center justify-center bg-black flex-shrink-0"
      data-ocid={`reels.item.${index + 1}`}
    >
      {isVideo ? (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer w-full h-full"
          onClick={handleTap}
          onKeyDown={handleKeyDown}
          aria-label={playing ? "Pause reel" : "Play reel"}
        >
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <track kind="captions" />
          </video>
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-black/40 flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </button>
      ) : (
        <img
          src={mediaUrl}
          alt={post.caption}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      <div
        className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-10"
        data-ocid={`reels.actions.${index + 1}`}
      >
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onLike}
            className="p-2 text-white hover:scale-110 transition-transform"
            data-ocid={`reels.like.${index + 1}`}
          >
            <Heart
              className={`h-7 w-7 ${isLiked ? "fill-red-500 text-red-500" : "fill-white"}`}
            />
          </button>
          <span className="text-white text-[12px] font-semibold">
            {likeCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="p-2 text-white hover:scale-110 transition-transform"
            data-ocid={`reels.comment.${index + 1}`}
          >
            <MessageCircle className="h-7 w-7 fill-white" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="p-2 text-white hover:scale-110 transition-transform"
            onClick={onShare}
            data-ocid={`reels.share.${index + 1}`}
          >
            <Send className="h-7 w-7" />
          </button>
          <span className="text-white text-[12px] font-semibold">Share</span>
        </div>

        <button type="button" className="p-2 text-white">
          <MoreHorizontal className="h-7 w-7" />
        </button>

        <div className="mt-2">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="text-xs bg-accent">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="absolute bottom-8 left-4 right-20 text-white z-10">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="text-xs">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-[14px]">{username}</span>
        </div>
        {post.caption && (
          <p className="text-[13px] line-clamp-2 mb-2">{post.caption}</p>
        )}
        {post.hashtags.length > 0 && (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <p className="text-[12px] opacity-80">
              {post.hashtags.map((t) => `#${t}`).join(" ")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReelShareDialog({
  post,
  onClose,
}: { post: Post; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { data: searchUsers = [] } = useSearchUsers(query);
  const { data: allUsers = [] } = useAllUsers();
  const sendMessage = useSendMessage();
  const { identity } = useInternetIdentity();

  const displayUsers = query.trim()
    ? searchUsers
    : allUsers.filter(
        (u) =>
          identity && u.id.toString() !== identity.getPrincipal().toString(),
      );

  const handleSend = async (toUser: UserProfile) => {
    try {
      await sendMessage.mutateAsync({
        toUser: toUser.id,
        text: `Check out this reel! [post:${post.id.toString()}]`,
      });
      toast.success(`Sent to ${toUser.username}`);
      onClose();
    } catch {
      toast.error("Failed to send");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        data-ocid="reels.share.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-[16px]">
            Share Reel
          </DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-xl"
          data-ocid="reels.share.search_input"
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
                    data-ocid="reels.share.send_button"
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
