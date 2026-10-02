import { CreatePostModal } from "@/components/CreatePostModal";
import { BottomDock, Header } from "@/components/Navigation";
import { NotesBar } from "@/components/NotesBar";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { PostDetailModal } from "@/components/PostDetailModal";
import { StoriesRow } from "@/components/StoriesRow";
import { StoryViewer } from "@/components/StoryViewer";
import { SuggestionsSidebar } from "@/components/SuggestionsSidebar";
import { Button } from "@/components/ui/button";
import {
  useActiveStories,
  useAllUsers,
  useExploreFeed,
  useHomeFeed,
  useMyProfile,
} from "@/hooks/useQueries";
import type { Post, Story, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Edit, ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export function HomePage() {
  const { identity } = useInternetIdentity();
  const { data: feedPosts = [], isLoading: feedLoading } = useHomeFeed();
  const { data: explorePosts = [], isLoading: exploreLoading } =
    useExploreFeed();
  const { data: stories = [] } = useActiveStories();
  const { data: allUsers = [] } = useAllUsers();
  const { data: myProfile } = useMyProfile();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"post" | "story" | "reel">(
    "post",
  );
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  const posts = identity ? feedPosts : explorePosts;
  const isLoading = identity ? feedLoading : exploreLoading;

  const selectedAuthor = selectedPost
    ? (profileMap.get(selectedPost.author.toString()) ?? null)
    : null;

  const handleStoryClick = (story: Story) => {
    const idx = stories.findIndex((s) => s.id === story.id);
    setStoryIndex(idx >= 0 ? idx : 0);
    setStoryViewerOpen(true);
  };

  return (
    <div className="page-bg min-h-screen" data-ocid="home.page">
      <Header
        onCreatePost={() => {
          setCreateMode("post");
          setCreateOpen(true);
        }}
      />

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-28">
        <div className="flex gap-6">
          <div className="flex-1 max-w-[470px] mx-auto lg:mx-0">
            {/* Stories Row */}
            <StoriesRow
              stories={stories}
              profileMap={profileMap}
              onStoryClick={handleStoryClick}
              onAddStory={() => {
                setCreateMode("story");
                setCreateOpen(true);
              }}
            />

            {/* Notes Bar — only shown when logged in */}
            {identity && <NotesBar myProfile={myProfile ?? null} />}

            {/* Feed */}
            {isLoading ? (
              [1, 2, 3].map((n) => <PostCardSkeleton key={n} />)
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl card-shadow p-10 text-center"
                data-ocid="home.empty_state"
              >
                <ImageIcon className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-[18px] font-bold text-foreground mb-2">
                  {identity ? "No posts yet" : "Welcome to KrossOver"}
                </h2>
                <p className="text-[14px] text-muted-foreground mb-6">
                  {identity
                    ? "Follow people or create your first post to see content here."
                    : "Sign in to share moments and connect with others."}
                </p>
                {identity && (
                  <Button
                    className="gold-btn rounded-full px-6 font-semibold gap-2"
                    onClick={() => {
                      setCreateMode("post");
                      setCreateOpen(true);
                    }}
                    data-ocid="home.create.primary_button"
                  >
                    <Edit className="h-4 w-4" /> Create Post
                  </Button>
                )}
              </motion.div>
            ) : (
              posts.map((post, i) => (
                <PostCard
                  key={post.id.toString()}
                  post={post}
                  authorProfile={profileMap.get(post.author.toString())}
                  index={i}
                  onPostClick={setSelectedPost}
                />
              ))
            )}
          </div>

          <SuggestionsSidebar />
        </div>
      </main>

      <BottomDock
        onCreatePost={() => {
          setCreateMode("post");
          setCreateOpen(true);
        }}
      />

      <PostDetailModal
        post={selectedPost}
        authorProfile={selectedAuthor}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode={createMode}
      />

      <StoryViewer
        stories={stories}
        profileMap={profileMap}
        initialStoryIndex={storyIndex}
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />
    </div>
  );
}
