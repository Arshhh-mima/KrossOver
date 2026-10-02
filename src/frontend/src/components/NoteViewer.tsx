import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useLikeNote,
  useNoteLikes,
  useReplyToNote,
  useUnlikeNote,
} from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { NoteWithAuthor } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Clock, Heart, Loader2, MessageCircle, Send, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface NoteViewerProps {
  item: NoteWithAuthor;
  isOwn: boolean;
  open: boolean;
  onClose: () => void;
}

export function NoteViewer({ item, isOwn, open, onClose }: NoteViewerProps) {
  const { identity } = useInternetIdentity();
  const { data: likers = [] } = useNoteLikes(item.note.author);
  const likeNote = useLikeNote();
  const unlikeNote = useUnlikeNote();
  const replyToNote = useReplyToNote();
  const [liked, setLiked] = useState(item.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(Number(item.likeCount));
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  const authorName =
    item.authorProfile?.displayName ??
    item.authorProfile?.username ??
    item.author?.displayName ??
    item.author?.username ??
    "User";
  const authorUsername =
    item.authorProfile?.username ?? item.author?.username ?? "user";
  const authorAvatar = item.authorProfile?.avatarUrl ?? item.author?.avatarUrl;

  function getTimeRemaining(): string {
    const nowMs = Date.now();
    const expiresMs = Number(item.note.expiresAt / BigInt(1_000_000));
    const diffMs = expiresMs - nowMs;
    if (diffMs <= 0) return "Expired";
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
    if (diffH >= 1) return `Expires in ${diffH}h ${diffM}m`;
    return `Expires in ${diffM}m`;
  }

  const handleLikeToggle = async () => {
    if (!identity) return;
    const prev = liked;
    const prevCount = likeCount;
    try {
      if (liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
        await unlikeNote.mutateAsync(item.note.author);
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
        await likeNote.mutateAsync(item.note.author);
      }
    } catch {
      setLiked(prev);
      setLikeCount(prevCount);
      toast.error("Action failed");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyToNote.mutateAsync({
        authorId: item.note.author,
        text: replyText.trim(),
      });
      toast.success("Reply sent! 💬");
      setReplyText("");
      setShowReplyInput(false);
      onClose();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-3xl p-0 overflow-hidden bg-card border-border"
        data-ocid="notes.viewer.dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
          aria-label="Close"
          data-ocid="notes.viewer.close_button"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        <div className="p-6 flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            {/* Note speech bubble above avatar */}
            <div className="relative max-w-[220px]">
              <div className="bg-secondary/80 border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-center shadow-sm">
                <p className="text-[15px] font-medium text-foreground leading-snug">
                  {item.note.text}
                </p>
              </div>
              {/* Speech bubble tail */}
              <div className="w-3 h-3 bg-secondary/80 border-l border-b border-border absolute -bottom-1.5 left-5 rotate-45 rounded-sm" />
            </div>

            {/* Avatar */}
            <div className="mt-2 p-[2px] rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500">
              <div className="p-0.5 rounded-full bg-background">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={authorAvatar} alt={authorUsername} />
                  <AvatarFallback className="bg-accent text-lg">
                    {authorUsername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Author info */}
            <div className="text-center">
              <p className="font-bold text-[15px] text-foreground">
                {authorName}
              </p>
              <p className="text-[12px] text-muted-foreground">
                @{authorUsername}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">
                  {getTimeRemaining()}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {timeAgo(item.note.createdAt)}
              </p>
            </div>
          </motion.div>

          {/* Like/Reply actions for others' notes */}
          {!isOwn && (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 rounded-xl gap-1.5 transition-colors ${
                  liked ? "border-pink-500/60 bg-pink-500/10 text-pink-500" : ""
                }`}
                onClick={handleLikeToggle}
                disabled={likeNote.isPending || unlikeNote.isPending}
                data-ocid="notes.viewer.like_button"
              >
                <Heart
                  className={`h-4 w-4 transition-transform ${
                    liked ? "fill-current scale-110" : ""
                  }`}
                />
                {likeCount > 0 ? likeCount : "Like"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl gap-1.5"
                onClick={() => setShowReplyInput((v) => !v)}
                data-ocid="notes.viewer.reply_button"
              >
                <MessageCircle className="h-4 w-4" />
                Reply
              </Button>
            </div>
          )}

          {/* Reply input — expands inline */}
          {!isOwn && showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="w-full overflow-hidden"
            >
              <div className="flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value.slice(0, 200))}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendReply()
                  }
                  placeholder={`Reply to ${authorName}...`}
                  className="flex-1 rounded-xl text-[13px]"
                  autoFocus
                  data-ocid="notes.viewer.reply_input"
                />
                <Button
                  size="icon"
                  className="gold-btn rounded-xl h-9 w-9 flex-shrink-0"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || replyToNote.isPending}
                  aria-label="Send reply"
                  data-ocid="notes.viewer.send_reply.button"
                >
                  {replyToNote.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Own note: show likers */}
          {isOwn && likers.length > 0 && (
            <div className="w-full">
              <p className="text-[12px] text-muted-foreground font-semibold mb-2">
                Liked by
              </p>
              <div className="flex flex-wrap gap-1">
                {likers.map((p) => (
                  <span
                    key={String(p)}
                    className="text-[11px] bg-secondary px-2 py-0.5 rounded-full text-foreground"
                  >
                    {String(p).slice(0, 8)}…
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
