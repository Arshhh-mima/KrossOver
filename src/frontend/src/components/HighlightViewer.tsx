import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDeleteHighlight } from "@/hooks/useQueries";
import type { Highlight } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface HighlightViewerProps {
  highlight: Highlight;
  isOwn: boolean;
  open: boolean;
  onClose: () => void;
}

function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export function HighlightViewer({
  highlight,
  isOwn,
  open,
  onClose,
}: HighlightViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deleteHighlight = useDeleteHighlight();

  const storyCount = Math.max(highlight.storyIds.length, 1);
  const coverIsVideo = isVideoUrl(highlight.coverUrl);

  // Auto-advance non-video slides after 5s
  useEffect(() => {
    if (!open || coverIsVideo) return;
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setCurrentIdx((i) => {
            if (i < storyCount - 1) return i + 1;
            onClose();
            return i;
          });
          return 0;
        }
        return p + 2; // 50 steps × 100ms = 5s
      });
    }, 100);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coverIsVideo, storyCount, onClose]);

  // Video playback sync
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setCurrentIdx((i) => {
        if (i < storyCount - 1) return i + 1;
        onClose();
        return i;
      });
    };
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    vid.addEventListener("ended", onEnded);
    vid.play().catch(() => {});
    return () => {
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
      vid.removeEventListener("ended", onEnded);
    };
  }, [storyCount, onClose]);

  const handleDelete = async () => {
    try {
      await deleteHighlight.mutateAsync(highlight.id);
      toast.success("Highlight deleted");
      onClose();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleVideoPlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm p-0 rounded-3xl overflow-hidden bg-[oklch(0.08_0.006_260)] border-border"
        data-ocid="highlights.viewer.dialog"
      >
        {/* Progress bars */}
        <div className="flex gap-1 p-3 absolute top-0 left-0 right-0 z-10">
          {Array.from({ length: storyCount }, (_, i) => i).map((step) => (
            <div
              key={`progress-step-${step}`}
              className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    step < currentIdx
                      ? "100%"
                      : step === currentIdx
                        ? coverIsVideo
                          ? "auto"
                          : `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-3 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          aria-label="Close"
          data-ocid="highlights.viewer.close_button"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Owner delete */}
        {isOwn && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-5 right-10 z-20 p-1.5 rounded-full bg-black/40 hover:bg-destructive/80 transition-colors"
            aria-label="Delete highlight"
            data-ocid="highlights.viewer.delete_button"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="aspect-[9/16] relative bg-secondary"
          >
            {coverIsVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={highlight.coverUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  loop={false}
                  muted={false}
                  controls={false}
                />
                {/* Video play/pause overlay */}
                <button
                  type="button"
                  onClick={toggleVideoPlay}
                  className="absolute inset-0 flex items-center justify-center z-10"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  data-ocid="highlights.viewer.toggle_play"
                >
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div
                        key="play-btn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-black/60 rounded-full p-4"
                      >
                        <Play className="h-8 w-8 text-white fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                {/* Video controls bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={toggleVideoPlay}
                      className="text-white hover:text-white/80 transition-colors"
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-white" />
                      ) : (
                        <Play className="h-5 w-5 fill-white" />
                      )}
                    </button>
                    <p className="text-white font-bold text-[16px] flex-1 truncate">
                      {highlight.title}
                    </p>
                  </div>
                </div>
              </>
            ) : highlight.coverUrl ? (
              <>
                <img
                  src={highlight.coverUrl}
                  alt={highlight.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                  <p className="text-white font-bold text-[18px]">
                    {highlight.title}
                  </p>
                  <p className="text-white/70 text-[12px]">
                    {highlight.storyIds.length} stories
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/40 to-accent/40 gap-4">
                <span className="text-6xl">⭐</span>
                <p className="text-white font-bold text-[20px]">
                  {highlight.title}
                </p>
                <p className="text-white/70 text-[13px]">
                  {highlight.storyIds.length} stories
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {storyCount > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setCurrentIdx((i) => Math.max(0, i - 1));
              }}
              disabled={currentIdx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 transition-colors"
              aria-label="Previous"
              data-ocid="highlights.viewer.prev.button"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setCurrentIdx((i) => Math.min(storyCount - 1, i + 1));
              }}
              disabled={currentIdx === storyCount - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 transition-colors"
              aria-label="Next"
              data-ocid="highlights.viewer.next.button"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
