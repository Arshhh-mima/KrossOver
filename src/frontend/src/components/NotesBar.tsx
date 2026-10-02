import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFollowersNotes, useMyNote } from "@/hooks/useQueries";
import type { NoteWithAuthor, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { PenLine, Plus } from "lucide-react";
import { useState } from "react";
import { CreateNoteModal } from "./CreateNoteModal";
import { NoteViewer } from "./NoteViewer";

interface NotesBarProps {
  myProfile: UserProfile | null | undefined;
}

export function NotesBar({ myProfile }: NotesBarProps) {
  const { identity } = useInternetIdentity();
  const { data: myNote, isLoading: myNoteLoading } = useMyNote();
  const { data: followersNotes = [], isLoading: notesLoading } =
    useFollowersNotes();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<NoteWithAuthor | null>(null);

  if (!identity) return null;

  const isLoading = myNoteLoading || notesLoading;

  function getExpiryLabel(expiresAt: bigint): {
    label: string;
    isExpiringSoon: boolean;
  } {
    const nowMs = Date.now();
    const expiresMs = Number(expiresAt / BigInt(1_000_000));
    const diffMs = expiresMs - nowMs;
    if (diffMs <= 0) return { label: "Expired", isExpiringSoon: true };
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
    if (diffH >= 1) return { label: `${diffH}h`, isExpiringSoon: diffH < 3 };
    return { label: `${diffM}m`, isExpiringSoon: true };
  }

  return (
    <>
      <div
        className="w-full overflow-x-auto scrollbar-hide py-3"
        data-ocid="notes.bar"
      >
        <div className="flex gap-4 px-1 min-w-max">
          {/* Own note bubble */}
          <div className="flex flex-col items-center gap-1.5 w-[60px] flex-shrink-0">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              aria-label={myNote ? "Edit your note" : "Add a note"}
              data-ocid="notes.own.button"
            >
              {/* Gradient ring when note exists */}
              <div
                className={`p-[2px] rounded-full ${
                  myNote
                    ? "bg-gradient-to-br from-primary via-purple-500 to-pink-500"
                    : "bg-border"
                }`}
              >
                <div className="p-0.5 rounded-full bg-background">
                  <Avatar className="h-11 w-11">
                    <AvatarImage
                      src={myProfile?.avatarUrl}
                      alt={myProfile?.username ?? "You"}
                    />
                    <AvatarFallback className="bg-accent text-xs">
                      {myProfile?.displayName?.slice(0, 2).toUpperCase() ??
                        "ME"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Add/Edit badge */}
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center h-5 w-5 rounded-full bg-primary border-2 border-background shadow-sm">
                {myNote ? (
                  <PenLine className="h-2.5 w-2.5 text-primary-foreground" />
                ) : (
                  <Plus className="h-2.5 w-2.5 text-primary-foreground" />
                )}
              </span>
            </button>
            {/* Note text or label */}
            {myNote ? (
              <div className="text-center w-full">
                <p className="text-[10px] text-foreground leading-tight line-clamp-2">
                  {myNote.text}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {getExpiryLabel(myNote.expiresAt).label}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                Add note
              </p>
            )}
          </div>

          {/* Loading placeholders */}
          {isLoading &&
            followersNotes.length === 0 &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 w-[60px] flex-shrink-0"
              >
                <div className="h-[52px] w-[52px] rounded-full bg-secondary animate-pulse" />
                <div className="h-2 w-10 rounded bg-secondary animate-pulse" />
              </div>
            ))}

          {/* Followers' notes */}
          {followersNotes.map((item, i) => {
            const { label: expLabel, isExpiringSoon } = getExpiryLabel(
              item.note.expiresAt,
            );
            const username =
              item.authorProfile?.username ?? item.author?.username ?? "??";
            return (
              <div
                key={item.note.id.toString()}
                className="flex flex-col items-center gap-1.5 w-[60px] flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setViewingNote(item)}
                  className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                  aria-label={`${username}'s note`}
                  data-ocid={`notes.follower.item.${i + 1}`}
                >
                  <div
                    className={`p-[2px] rounded-full bg-gradient-to-br ${
                      isExpiringSoon
                        ? "from-muted-foreground/50 to-muted-foreground/30"
                        : "from-primary via-purple-500 to-pink-500"
                    }`}
                  >
                    <div className="p-0.5 rounded-full bg-background">
                      <Avatar className="h-11 w-11">
                        <AvatarImage
                          src={
                            item.authorProfile?.avatarUrl ??
                            item.author?.avatarUrl
                          }
                          alt={username}
                        />
                        <AvatarFallback className="bg-accent text-xs">
                          {username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  {/* Expiry chip */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full border-2 border-background text-[8px] font-bold shadow-sm ${
                      isExpiringSoon
                        ? "bg-muted-foreground/70 text-background"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {expLabel}
                  </span>
                </button>
                <div className="text-center w-full">
                  <p className="text-[10px] text-foreground leading-tight line-clamp-2">
                    {item.note.text}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                    {username}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Empty state — only if not loading and no notes from others */}
          {!isLoading && followersNotes.length === 0 && (
            <div className="flex items-center pl-2">
              <p className="text-[11px] text-muted-foreground whitespace-nowrap italic">
                Notes from people you follow will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateNoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existingNote={myNote ?? null}
      />

      {viewingNote && (
        <NoteViewer
          item={viewingNote}
          isOwn={false}
          open={!!viewingNote}
          onClose={() => setViewingNote(null)}
        />
      )}
    </>
  );
}
