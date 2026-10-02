import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnswerQuestion, useVotePoll } from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { Story, UserProfile } from "@/types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(url);
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='700' viewBox='0 0 400 700'%3E%3Crect width='400' height='700' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23555'%3EMedia unavailable%3C/text%3E%3C/svg%3E";

function safeMediaUrl(url: string | undefined | null): string {
  if (!url || url.length < 5) return PLACEHOLDER_IMG;
  return url;
}

interface PollMeta {
  _stickerType: "poll";
  question: string;
  options: string[];
}

interface QuestionMeta {
  _stickerType: "question";
  prompt: string;
}

type StickerMeta = PollMeta | QuestionMeta;

function parseStickerFromCaption(caption: string): StickerMeta | null {
  const match = caption.match(/<!--sticker:(.+?)-->/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as StickerMeta;
  } catch {
    return null;
  }
}

function cleanCaption(caption: string): string {
  return caption.replace(/\n?<!--sticker:.+?-->/s, "").trim();
}

function PollOverlay({
  storyId,
  meta,
}: {
  storyId: bigint;
  meta: PollMeta;
}) {
  const votePoll = useVotePoll();
  const [voted, setVoted] = useState<number | null>(null);
  // Simulate local vote counts (real counts would require a query)
  const [counts, setCounts] = useState([0, 0]);

  const handleVote = async (idx: number) => {
    if (voted !== null) return;
    setVoted(idx);
    setCounts((prev) => {
      const next = [...prev];
      next[idx] = next[idx] + 1;
      return next;
    });
    try {
      await votePoll.mutateAsync({
        pollId: storyId.toString(),
        optionIndex: BigInt(idx),
      });
    } catch {
      // silent — local state already updated
    }
  };

  const total = counts[0] + counts[1];

  return (
    <div className="mx-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
      <p className="text-white text-[14px] font-semibold text-center">
        {meta.question}
      </p>
      <div className="space-y-2">
        {meta.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleVote(i)}
              disabled={voted !== null}
              className="relative w-full rounded-xl border-2 border-white/40 overflow-hidden transition-all hover:border-white/80 disabled:cursor-default"
              data-ocid={`story.poll.option.${i + 1}`}
            >
              {voted !== null && (
                <div
                  className={`absolute inset-y-0 left-0 ${voted === i ? "bg-primary/40" : "bg-white/10"} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="text-white text-[13px] font-medium">
                  {opt}
                </span>
                {voted !== null && (
                  <span className="text-white/80 text-[12px]">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionOverlay({
  storyId,
  meta,
}: {
  storyId: bigint;
  meta: QuestionMeta;
}) {
  const answerQuestion = useAnswerQuestion();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim() || submitted) return;
    try {
      await answerQuestion.mutateAsync({
        questionId: storyId.toString(),
        answer: answer.trim(),
      });
      setSubmitted(true);
      toast.success("Answer sent!");
    } catch {
      toast.error("Could not send answer");
    }
  };

  return (
    <div className="mx-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
      <p className="text-white/70 text-[12px] font-medium text-center uppercase tracking-wide">
        Ask me anything
      </p>
      <p className="text-white text-[14px] font-semibold text-center">
        {meta.prompt}
      </p>
      {submitted ? (
        <p className="text-center text-[13px] text-primary font-medium">
          ✓ Answer sent!
        </p>
      ) : (
        <div className="flex gap-2">
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer..."
            className="flex-1 rounded-xl bg-white/10 border-white/30 text-white placeholder:text-white/50 text-[13px]"
            data-ocid="story.question.input"
          />
          <Button
            size="sm"
            className="gold-btn rounded-xl"
            disabled={!answer.trim() || answerQuestion.isPending}
            onClick={handleSubmit}
            data-ocid="story.question.submit_button"
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

type StoryViewerProps = {
  stories: Story[];
  profileMap: Map<string, UserProfile>;
  initialStoryIndex: number;
  open: boolean;
  onClose: () => void;
};

export function StoryViewer({
  stories,
  profileMap,
  initialStoryIndex,
  open,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const STORY_DURATION = 5000;

  useEffect(() => {
    if (!open || stories.length === 0) return;
    setProgress(0);

    const story = stories[currentIndex];
    const isVideo = story ? isVideoUrl(safeMediaUrl(story.imageUrl)) : false;

    if (isVideo) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 100 / (STORY_DURATION / 100);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [open, currentIndex, onClose, stories]);

  const handleVideoEnded = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  useEffect(() => {
    setCurrentIndex(initialStoryIndex);
    setProgress(0);
  }, [initialStoryIndex]);

  useEffect(() => {
    const story = stories[currentIndex];
    if (!story) return;
    const isVideo = isVideoUrl(safeMediaUrl(story.imageUrl));
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, stories]);

  const story = stories[currentIndex];

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  if (!story) return null;

  const profile = profileMap.get(story.author.toString());
  const username = profile?.username || story.author.toString().slice(0, 8);
  const avatarUrl = profile?.avatarUrl || "";
  const mediaUrl = safeMediaUrl(story.imageUrl);
  const isVideo = isVideoUrl(mediaUrl);

  const stickerMeta = parseStickerFromCaption(story.caption || "");
  const displayCaption = cleanCaption(story.caption || "");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          data-ocid="story.modal"
        >
          <div className="relative w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden">
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
              {stories.map((s, i) => (
                <div
                  key={s.id.toString()}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width:
                        i < currentIndex
                          ? "100%"
                          : i === currentIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story header */}
            <div className="absolute top-8 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-white">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback className="text-xs">
                    {username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-[13px] font-semibold">
                  {username}
                </span>
                <span className="text-white/60 text-[12px]">
                  {timeAgo(story.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-white"
                aria-label="Close story"
                data-ocid="story.close_button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Story media */}
            {isVideo ? (
              <video
                ref={videoRef}
                key={story.id.toString()}
                src={mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleVideoTimeUpdate}
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt={`${username}'s story`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG;
                }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Caption */}
            {displayCaption && (
              <div className="absolute bottom-20 left-4 right-4 text-center">
                <p className="text-white text-[14px] font-medium drop-shadow-lg">
                  {displayCaption}
                </p>
              </div>
            )}

            {/* Sticker overlay */}
            {stickerMeta && (
              <div className="absolute bottom-4 left-0 right-0 z-20 pointer-events-auto">
                {stickerMeta._stickerType === "poll" ? (
                  <PollOverlay storyId={story.id} meta={stickerMeta} />
                ) : (
                  <QuestionOverlay storyId={story.id} meta={stickerMeta} />
                )}
              </div>
            )}

            {/* Tap zones (only when no sticker active) */}
            {!stickerMeta && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-0 top-0 h-full w-1/3"
                  aria-label="Previous story"
                  data-ocid="story.pagination_prev"
                />
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-0 top-0 h-full w-1/3"
                  aria-label="Next story"
                  data-ocid="story.pagination_next"
                />
              </>
            )}

            {/* Arrow buttons */}
            <div className="absolute inset-y-0 flex items-center justify-between w-full px-2 pointer-events-none">
              <button
                type="button"
                onClick={goPrev}
                className="pointer-events-auto p-1 bg-black/20 rounded-full text-white"
                data-ocid="story.prev_button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="pointer-events-auto p-1 bg-black/20 rounded-full text-white"
                data-ocid="story.next_button"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
