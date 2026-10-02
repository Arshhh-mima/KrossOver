import { useHighlights } from "@/hooks/useQueries";
import type { Highlight, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { CreateHighlightModal } from "./CreateHighlightModal";
import { HighlightViewer } from "./HighlightViewer";

function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

interface HighlightsRowProps {
  profilePrincipal: unknown;
  isOwnProfile: boolean;
  myProfile?: UserProfile | null;
}

export function HighlightsRow({
  profilePrincipal,
  isOwnProfile,
}: HighlightsRowProps) {
  const { identity } = useInternetIdentity();
  const { data: highlights = [], isLoading } = useHighlights(profilePrincipal);
  const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  if (!isLoading && highlights.length === 0 && !isOwnProfile) return null;

  return (
    <>
      <div
        className="w-full overflow-x-auto scrollbar-hide py-2"
        data-ocid="highlights.row"
      >
        <div className="flex gap-4 px-1 min-w-max items-start">
          {/* Add highlight button (own profile only) */}
          {isOwnProfile && identity && (
            <div className="flex flex-col items-center gap-1.5 w-16 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors bg-secondary/40"
                aria-label="Create new highlight"
                data-ocid="highlights.create.button"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
              </button>
              <span className="text-[11px] text-muted-foreground text-center">
                New
              </span>
            </div>
          )}

          {/* Highlights */}
          {highlights.map((hl, i) => {
            const isVideo = isVideoUrl(hl.coverUrl);
            return (
              <div
                key={hl.id.toString()}
                className="flex flex-col items-center gap-1.5 w-16 flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setViewingHighlight(hl)}
                  className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors flex-shrink-0 group"
                  aria-label={`View highlight: ${hl.title}`}
                  data-ocid={`highlights.item.${i + 1}`}
                >
                  {hl.coverUrl ? (
                    isVideo ? (
                      <>
                        <video
                          src={hl.coverUrl}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                          <Play className="h-5 w-5 text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={hl.coverUrl}
                        alt={hl.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                      <span className="text-xl">⭐</span>
                    </div>
                  )}
                </button>
                <span className="text-[11px] text-foreground text-center truncate w-full">
                  {hl.title}
                </span>
              </div>
            );
          })}

          {/* Empty state for own profile with no highlights */}
          {isLoading && (
            <div className="flex gap-4 px-1">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex flex-col items-center gap-1.5 w-16"
                >
                  <div className="h-16 w-16 rounded-full bg-secondary animate-pulse" />
                  <div className="h-2 w-10 bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingHighlight && (
        <HighlightViewer
          highlight={viewingHighlight}
          isOwn={isOwnProfile}
          open={!!viewingHighlight}
          onClose={() => setViewingHighlight(null)}
        />
      )}

      {createOpen && (
        <CreateHighlightModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}
