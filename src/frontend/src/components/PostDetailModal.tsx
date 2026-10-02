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
  useAddComment,
  useAddReaction,
  useAllUsers,
  useCommentLikeCount,
  useGetReactions,
  useIsCommentLiked,
  useIsLiked,
  useLikeComment,
  usePostComments,
  usePostLikeCount,
  useRemoveReaction,
  useToggleLike,
  useToggleSave,
  useUnlikeComment,
} from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { Comment, Post, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "🔥", "👏"];

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(url);
}

function getPostMedia(post: Post): string[] {
  if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls;
  if (post.imageUrl) return [post.imageUrl];
  return [];
}

type PostDetailModalProps = {
  post: Post | null;
  authorProfile?: UserProfile | null;
  open: boolean;
  onClose: () => void;
};

function CommentItem({
  comment,
  postId,
  cUsername,
  cAvatar,
  index,
}: {
  comment: Comment;
  postId: bigint;
  cUsername: string;
  cAvatar: string;
  index: number;
}) {
  const { identity } = useInternetIdentity();
  const { data: isLiked = false } = useIsCommentLiked(postId, comment.id);
  const { data: likeCount = BigInt(0) } = useCommentLikeCount(
    postId,
    comment.id,
  );
  const likeComment = useLikeComment();
  const unlikeComment = useUnlikeComment();

  const handleLike = () => {
    if (!identity) return;
    if (isLiked) {
      unlikeComment.mutate({ postId, commentId: comment.id });
    } else {
      likeComment.mutate({ postId, commentId: comment.id });
    }
  };

  return (
    <div
      className="flex gap-3 group"
      data-ocid={`post.comments.item.${index + 1}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={cAvatar} alt={cUsername} />
        <AvatarFallback className="bg-accent text-xs">
          {cUsername.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-[13px]">{cUsername} </span>
            <span className="text-[13px]">{comment.text}</span>
          </div>
          {identity && (
            <button
              type="button"
              onClick={handleLike}
              className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={isLiked ? "Unlike comment" : "Like comment"}
              data-ocid={`post.comment.like.${index + 1}`}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
              />
              {Number(likeCount) > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {Number(likeCount)}
                </span>
              )}
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {timeAgo(comment.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ReactionPicker({
  postId,
  onClose,
}: {
  postId: bigint;
  onClose: () => void;
}) {
  const { identity } = useInternetIdentity();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const handleEmoji = async (emoji: string) => {
    if (!identity) return;
    try {
      // Toggle: try remove first, then add
      await removeReaction.mutateAsync({ postId }).catch(() => {});
      await addReaction.mutateAsync({ postId, emoji });
    } catch {
      // silent
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 bg-card border border-border rounded-2xl px-3 py-2 shadow-lg">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleEmoji(emoji)}
          className="text-lg hover:scale-125 transition-transform rounded-full w-8 h-8 flex items-center justify-center"
          aria-label={emoji}
          data-ocid={`post.reaction.${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ReactionSummary({ postId }: { postId: bigint }) {
  const { data: reactions = [] } = useGetReactions(postId);

  const totals = useMemo(() => {
    // reactions is [string, bigint][] — emoji + count
    return reactions
      .filter(([, count]) => Number(count) > 0)
      .map(([emoji, count]) => ({ emoji, count: Number(count) }));
  }, [reactions]);

  if (totals.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {totals.map(({ emoji, count }) => (
        <span
          key={emoji}
          className="flex items-center gap-0.5 bg-secondary rounded-full px-2 py-0.5 text-[12px]"
        >
          {emoji} <span className="text-muted-foreground">{count}</span>
        </span>
      ))}
    </div>
  );
}

export function PostDetailModal({
  post,
  authorProfile,
  open,
  onClose,
}: PostDetailModalProps) {
  const { identity } = useInternetIdentity();
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(
    post?.id ?? null,
  );
  const { data: isLiked = false } = useIsLiked(post?.id ?? null);
  const { data: likeCountBig = BigInt(0) } = usePostLikeCount(post?.id ?? null);
  const { data: allUsers = [] } = useAllUsers();
  const addComment = useAddComment();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const [commentText, setCommentText] = useState("");
  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  if (!post) return null;

  const media = getPostMedia(post);
  const isCarousel = media.length > 1;
  const currentMedia = media[carouselIdx] ?? post.imageUrl;
  const currentIsVideo = isVideoUrl(currentMedia);

  const likeCount = Number(likeCountBig);
  const displayName =
    authorProfile?.displayName ||
    authorProfile?.username ||
    `${post.author.toString().slice(0, 8)}...`;
  const username =
    authorProfile?.username || `${post.author.toString().slice(0, 8)}...`;
  const avatarUrl = authorProfile?.avatarUrl || "";

  const handleLike = () => {
    if (!identity) return;
    toggleLike.mutate(post.id);
  };

  const handleSave = () => {
    if (!identity) return;
    setIsSavedLocal((p) => !p);
    toggleSave.mutate(post.id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !identity) return;
    await addComment.mutateAsync({ postId: post.id, text: commentText.trim() });
    setCommentText("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden rounded-2xl"
        data-ocid="post.modal"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Post by {username}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: media / carousel */}
          <div className="md:w-[55%] bg-black flex items-center relative">
            {currentIsVideo ? (
              <video
                src={currentMedia}
                controls
                className="w-full object-contain max-h-[70vh]"
                playsInline
                preload="metadata"
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={currentMedia}
                alt={post.caption}
                className="w-full object-contain max-h-[70vh]"
              />
            )}
            {isCarousel && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIdx((i) => (i > 0 ? i - 1 : media.length - 1))
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                  aria-label="Previous"
                  data-ocid="post.modal.carousel_prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIdx((i) => (i < media.length - 1 ? i + 1 : 0))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                  aria-label="Next"
                  data-ocid="post.modal.carousel_next"
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

          {/* Right: header + comments + actions */}
          <div className="md:w-[45%] flex flex-col border-l border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-accent text-xs">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[13px]">{username}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {timeAgo(post.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1">
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1"
                  data-ocid="post.close_button"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-72 md:max-h-none">
              {post.caption && (
                <div className="p-4 border-b border-border">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-accent text-xs">
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-[13px]">
                        {username}{" "}
                      </span>
                      <span className="text-[13px]">{post.caption}</span>
                      {post.hashtags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {post.hashtags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[12px] text-primary"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3" data-ocid="post.comments.list">
                {commentsLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!commentsLoading && comments.length === 0 && (
                  <p
                    className="text-[13px] text-muted-foreground text-center py-4"
                    data-ocid="post.comments.empty_state"
                  >
                    No comments yet. Be the first!
                  </p>
                )}
                {comments.map((c, i) => {
                  const commentAuthor = profileMap.get(c.author.toString());
                  const cUsername =
                    commentAuthor?.username ||
                    `${c.author.toString().slice(0, 8)}...`;
                  const cAvatar = commentAuthor?.avatarUrl || "";
                  return (
                    <CommentItem
                      key={c.id.toString()}
                      comment={c}
                      postId={post.id}
                      cUsername={cUsername}
                      cAvatar={cAvatar}
                      index={i}
                    />
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    className="hover:scale-110 transition-transform"
                    data-ocid="post.like.toggle"
                  >
                    <Heart
                      className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`}
                    />
                  </button>
                  <button
                    type="button"
                    className="hover:scale-110 transition-transform"
                  >
                    <MessageCircle className="h-6 w-6 text-foreground" />
                  </button>
                  <button
                    type="button"
                    className="hover:scale-110 transition-transform"
                  >
                    <Send className="h-6 w-6 text-foreground" />
                  </button>
                  {identity && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowReactionPicker((v) => !v)}
                        className="hover:scale-110 transition-transform"
                        aria-label="Add reaction"
                        data-ocid="post.reaction.open_modal_button"
                      >
                        <Smile className="h-6 w-6 text-foreground" />
                      </button>
                      {showReactionPicker && (
                        <div className="absolute bottom-8 left-0 z-50">
                          <ReactionPicker
                            postId={post.id}
                            onClose={() => setShowReactionPicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="hover:scale-110 transition-transform"
                  data-ocid="post.save.toggle"
                >
                  <Bookmark
                    className={`h-6 w-6 ${isSavedLocal ? "fill-foreground text-foreground" : "text-foreground"}`}
                  />
                </button>
              </div>
              <p className="text-[13px] font-semibold">
                {likeCount.toLocaleString()} likes
              </p>
              <ReactionSummary postId={post.id} />
            </div>

            {identity && (
              <div className="border-t border-border p-3 flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="border-0 bg-transparent focus-visible:ring-0 text-[13px] pl-0"
                  data-ocid="post.comment.input"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="text-primary text-[13px] font-semibold p-0 h-auto hover:bg-transparent"
                  data-ocid="post.comment.submit_button"
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
