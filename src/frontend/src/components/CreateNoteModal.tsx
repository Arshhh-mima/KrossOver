import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCreateNote, useDeleteNote } from "@/hooks/useQueries";
import { type Note, NoteAudience } from "@/types";
import { Loader2, Star, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
  existingNote: Note | null;
}

const MAX_CHARS = 60;

export function CreateNoteModal({
  open,
  onClose,
  existingNote,
}: CreateNoteModalProps) {
  const { isOnline } = useOnlineStatus();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<NoteAudience>(
    NoteAudience.MutualFollowers,
  );
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  // Sync state when modal opens or existingNote changes
  useEffect(() => {
    if (open) {
      setText(existingNote?.text ?? "");
      setAudience(
        (existingNote?.audience as NoteAudience) ??
          NoteAudience.MutualFollowers,
      );
    }
  }, [open, existingNote]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!isOnline) {
      toast.error("Cannot perform this action while offline");
      return;
    }
    try {
      await createNote.mutateAsync({ text: text.trim(), audience });
      toast.success(
        existingNote ? "Note updated! ✨" : "Note shared with followers! ✨",
      );
      onClose();
    } catch {
      toast.error("Failed to share note");
    }
  };

  const handleDelete = async () => {
    if (!isOnline) {
      toast.error("Cannot perform this action while offline");
      return;
    }
    try {
      await deleteNote.mutateAsync();
      toast.success("Note deleted");
      onClose();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const charCount = text.length;
  const remaining = MAX_CHARS - charCount;
  const isNearLimit = remaining <= 10;
  const isAtLimit = remaining <= 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-3xl bg-card border-border"
        data-ocid="create.note.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-[17px]">
            {existingNote ? "Edit Note" : "Share a Note"}
          </DialogTitle>
          <p className="text-center text-[12px] text-muted-foreground">
            Visible to your followers for 24 hours
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text input with char counter */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Share a thought with your followers..."
              className="rounded-2xl resize-none text-[14px] min-h-[90px] pb-8"
              autoFocus
              data-ocid="create.note.textarea"
            />
            {/* Character counter: X/60 format */}
            <span
              className={`absolute bottom-3 right-3 text-[11px] font-mono tabular-nums ${
                isAtLimit
                  ? "text-destructive font-bold"
                  : isNearLimit
                    ? "text-yellow-500"
                    : "text-muted-foreground"
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
            {/* Thin progress bar along bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-border overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  isAtLimit
                    ? "bg-destructive"
                    : isNearLimit
                      ? "bg-yellow-500"
                      : "bg-primary"
                }`}
                style={{ width: `${(charCount / MAX_CHARS) * 100}%` }}
              />
            </div>
          </div>

          {/* Audience selector */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Share with
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAudience(NoteAudience.MutualFollowers)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-medium transition-colors ${
                  audience === NoteAudience.MutualFollowers
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="create.note.mutual_followers.toggle"
              >
                <Users className="h-3.5 w-3.5" />
                Your Followers
              </button>
              <button
                type="button"
                onClick={() => setAudience(NoteAudience.CloseFriends)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-medium transition-colors ${
                  audience === NoteAudience.CloseFriends
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="create.note.close_friends.toggle"
              >
                <Star className="h-3.5 w-3.5" />
                Close Friends
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {existingNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteNote.isPending}
                className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
                data-ocid="create.note.delete_button"
              >
                {deleteNote.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              data-ocid="create.note.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gold-btn rounded-xl"
              onClick={handleSubmit}
              disabled={!text.trim() || createNote.isPending}
              data-ocid="create.note.submit_button"
            >
              {createNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : existingNote ? (
                "Update"
              ) : (
                "Share"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
