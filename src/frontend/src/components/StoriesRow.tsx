import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Story, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Plus } from "lucide-react";
import { motion } from "motion/react";

type StoriesRowProps = {
  stories: Story[];
  profileMap: Map<string, UserProfile>;
  onStoryClick?: (story: Story) => void;
  onAddStory?: () => void;
};

export function StoriesRow({
  stories,
  profileMap,
  onStoryClick,
  onAddStory,
}: StoriesRowProps) {
  const { identity } = useInternetIdentity();

  return (
    <div className="bg-card rounded-2xl card-shadow mb-4 px-4 py-3">
      <p className="text-[13px] font-semibold text-foreground mb-3">Stories</p>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {/* Add story button for logged-in users */}
        {identity && (
          <motion.button
            type="button"
            onClick={onAddStory}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            aria-label="Add your story"
            data-ocid="story.upload_button"
          >
            <div className="relative h-[56px] w-[56px]">
              <div className="h-full w-full rounded-full bg-secondary border-2 border-dashed border-primary/40 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground w-14 text-center truncate">
              Your Story
            </span>
          </motion.button>
        )}

        {stories.length === 0 && !identity && (
          <p className="text-[12px] text-muted-foreground py-2">
            No stories yet
          </p>
        )}

        {stories.map((story, i) => {
          const profile = profileMap.get(story.author.toString());
          const username =
            profile?.username || story.author.toString().slice(0, 8);
          const avatarUrl = profile?.avatarUrl || "";
          return (
            <motion.button
              key={story.id.toString()}
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onStoryClick?.(story)}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              aria-label={`View ${username}'s story`}
              data-ocid={`story.item.${i + 1}`}
            >
              <div className="story-ring">
                <div className="story-inner">
                  <Avatar className="h-[52px] w-[52px]">
                    <AvatarImage src={avatarUrl} alt={username} />
                    <AvatarFallback className="bg-accent text-xs">
                      {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[11px] text-foreground w-14 text-center truncate">
                {username}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
