import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveStories, useCreateHighlight } from "@/hooks/useQueries";
import { Clapperboard, ImageIcon, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateHighlightModalProps {
  open: boolean;
  onClose: () => void;
}

function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export function CreateHighlightModal({
  open,
  onClose,
}: CreateHighlightModalProps) {
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedStories, setSelectedStories] = useState<bigint[]>([]);
  const { data: stories = [] } = useActiveStories();
  const createHighlight = useCreateHighlight();

  const toggleStory = (id: bigint) => {
    setSelectedStories((prev) =>
      prev.some((s) => s === id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    try {
      await createHighlight.mutateAsync({
        title: title.trim(),
        coverUrl: coverUrl.trim(),
      });
      toast.success("Highlight created!");
      onClose();
    } catch {
      toast.error("Failed to create highlight");
    }
  };

  const coverIsVideo = isVideoUrl(coverUrl.trim());

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-3xl bg-card border-border"
        data-ocid="create.highlight.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center">New Highlight</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer 2026"
              className="rounded-xl"
              data-ocid="create.highlight.title.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Cover (image or video URL, optional)
            </Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... (.jpg, .mp4, .webm, ...)"
              className="rounded-xl"
              data-ocid="create.highlight.cover.input"
            />
            {/* Cover preview */}
            {coverUrl.trim() && (
              <div className="mt-2 h-24 w-24 rounded-full overflow-hidden border-2 border-border mx-auto">
                {coverIsVideo ? (
                  <div className="relative w-full h-full">
                    <video
                      src={coverUrl.trim()}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={coverUrl.trim()}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Story picker */}
          {stories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                Add from recent stories ({selectedStories.length} selected)
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                {stories.map((story) => {
                  const checked = selectedStories.some((s) => s === story.id);
                  const isVideo = isVideoUrl(story.imageUrl);
                  return (
                    <button
                      key={story.id.toString()}
                      type="button"
                      onClick={() => toggleStory(story.id)}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-colors ${
                        checked
                          ? "border-primary shadow-[0_0_0_2px_oklch(0.56_0.22_320/0.4)]"
                          : "border-transparent hover:border-border"
                      }`}
                      aria-label={`${checked ? "Deselect" : "Select"} story`}
                      data-ocid={`create.highlight.story.${story.id.toString()}`}
                    >
                      {isVideo ? (
                        <>
                          <video
                            src={story.imageUrl}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Clapperboard className="h-4 w-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={story.imageUrl}
                          alt={story.caption}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {checked && (
                        <div className="absolute inset-0 bg-primary/25 flex items-end justify-end p-1">
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">
                              ✓
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stories.length === 0 && (
            <div className="flex flex-col items-center py-4 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-[12px] text-muted-foreground">
                No active stories. Post a story to add it to this highlight.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              data-ocid="create.highlight.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gold-btn rounded-xl"
              onClick={handleCreate}
              disabled={!title.trim() || createHighlight.isPending}
              data-ocid="create.highlight.submit_button"
            >
              {createHighlight.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
