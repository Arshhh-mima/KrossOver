import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type {
  ActivityStatus,
  Comment,
  Highlight,
  Message,
  Note,
  NoteAudience,
  NoteWithAuthor,
  Notification,
  Post,
  Story,
  UserProfile,
} from "../types";

// ---- Profile ----

export function useMyProfile() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["myProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyProfile() as Promise<UserProfile | null>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useProfile(uid: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      if (!actor || !uid) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getProfileByUsername(
        uid,
      ) as Promise<UserProfile | null>;
    },
    enabled: !!actor && !isFetching && !!uid,
  });
}

export function useProfileByPrincipal(principal: unknown | undefined) {
  const { actor, isFetching } = useActor(createActor);
  const key = principal ? String(principal) : undefined;
  return useQuery({
    queryKey: ["profileByPrincipal", key],
    queryFn: async () => {
      if (!actor || !principal) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getProfile(
        principal,
      ) as Promise<UserProfile | null>;
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 60_000,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [] as UserProfile[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllUsers() as Promise<UserProfile[]>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ---- Feed ----

export function useExploreFeed() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["exploreFeed"],
    queryFn: async () => {
      if (!actor) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getExploreFeed() as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReelsFeed() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reelsFeed"],
    queryFn: async () => {
      if (!actor) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = actor as any;
      // Use getReelsFeed if available, fall back to getExploreFeed
      if (typeof a.getReelsFeed === "function") {
        const reels = (await a.getReelsFeed()) as Post[];
        return reels;
      }
      // Fallback: filter explore feed for video posts
      const all = (await a.getExploreFeed()) as Post[];
      return all.filter(
        (p: Post) =>
          p.imageUrl && /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(p.imageUrl),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHomeFeed() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["homeFeed", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getHomeFeed() as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ---- Stories ----

export function useActiveStories() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["activeStories"],
    queryFn: async () => {
      if (!actor) return [] as Story[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActiveStories() as Promise<Story[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Comments ----

export function usePostComments(postId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["comments", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return [] as Comment[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getComments(postId) as Promise<Comment[]>;
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

// ---- Notifications ----

export function useNotifications() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["notifications", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as Notification[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getNotifications() as Promise<Notification[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30_000,
  });
}

// ---- Messages ----

export function useConversationList() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["conversationList", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getConversationList() as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useConversation(otherPrincipal: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const key = otherPrincipal ? String(otherPrincipal) : null;
  return useQuery({
    queryKey: ["conversation", identity?.getPrincipal().toString(), key],
    queryFn: async () => {
      if (!actor || !identity || !otherPrincipal) return [] as Message[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getConversation(otherPrincipal) as Promise<
        Message[]
      >;
    },
    enabled: !!actor && !isFetching && !!identity && !!otherPrincipal,
    refetchInterval: 3000,
  });
}

// ---- Posts ----

export function useUserPosts(uid: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = uid ? String(uid) : null;
  return useQuery({
    queryKey: ["userPosts", key],
    queryFn: async () => {
      if (!actor || !uid) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPostsByUser(uid) as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching && !!uid,
  });
}

export function useSavedPosts() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["savedPosts", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getSavedPosts() as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetPostImages(postId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["postImages", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return [] as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPostImages(postId) as Promise<string[]>;
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

// ---- Follow ----

export function useFollowers(uid: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = uid ? String(uid) : null;
  return useQuery({
    queryKey: ["followers", key],
    queryFn: async () => {
      if (!actor || !uid) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getFollowers(uid) as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!uid,
  });
}

export function useFollowing(uid: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = uid ? String(uid) : null;
  return useQuery({
    queryKey: ["following", key],
    queryFn: async () => {
      if (!actor || !uid) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getFollowing(uid) as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!uid,
  });
}

export function useIsFollowing(target: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const key = target ? String(target) : null;
  return useQuery({
    queryKey: ["isFollowing", identity?.getPrincipal().toString(), key],
    queryFn: async () => {
      if (!actor || !identity || !target) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isFollowing(target) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!identity && !!target,
  });
}

// ---- Likes ----

export function usePostLikeCount(postId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["likeCount", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return BigInt(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getLikeCount(postId) as Promise<bigint>;
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useIsLiked(postId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: [
      "isLiked",
      postId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || !postId || !identity) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isLiked(postId) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!postId && !!identity,
  });
}

// ---- Search ----

export function useSearchUsers(query: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [] as UserProfile[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).searchUsers(query) as Promise<UserProfile[]>;
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function useSearchByHashtag(tag: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["searchHashtag", tag],
    queryFn: async () => {
      if (!actor || !tag.trim()) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).searchByHashtag(tag) as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching && tag.trim().length > 0,
  });
}

// ---- Trending Hashtags ----

export function useTrendingHashtags(limit = 10) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["trendingHashtags", limit],
    queryFn: async () => {
      if (!actor) return [] as [string, bigint][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getTrendingHashtags(BigInt(limit)) as Promise<
        [string, bigint][]
      >;
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ---- Activity Status ----

export function useActivityStatus(userId: unknown | undefined) {
  const { actor, isFetching } = useActor(createActor);
  const key = userId ? String(userId) : undefined;
  return useQuery({
    queryKey: ["activityStatus", key],
    queryFn: async () => {
      if (!actor || !userId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActivityStatus(
        userId,
      ) as Promise<ActivityStatus | null>;
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 60_000,
  });
}

export function useActivityStatusBatch(userIds: unknown[]) {
  const { actor, isFetching } = useActor(createActor);
  const key = userIds.map(String).join(",");
  return useQuery({
    queryKey: ["activityStatusBatch", key],
    queryFn: async () => {
      if (!actor || userIds.length === 0)
        return [] as [unknown, ActivityStatus][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActivityStatusBatch(userIds) as Promise<
        [unknown, ActivityStatus][]
      >;
    },
    enabled: !!actor && !isFetching && userIds.length > 0,
    refetchInterval: 60_000,
  });
}

export function useUpdateActivityStatus() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateActivityStatus();
    },
  });
}

// ---- Notes ----

export function useMyNote() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["myNote", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyNote() as Promise<Note | null>;
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30_000,
  });
}

export function useFollowersNotes() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["followersNotes", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as NoteWithAuthor[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getFollowersNotes() as Promise<NoteWithAuthor[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30_000,
  });
}

export function useNoteLikes(authorId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = authorId ? String(authorId) : null;
  return useQuery({
    queryKey: ["noteLikes", key],
    queryFn: async () => {
      if (!actor || !authorId) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getNoteLikes(authorId) as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!authorId,
  });
}

export function useCreateNote() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { text: string; audience: NoteAudience }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).createNote(
        data.text,
        data.audience,
      ) as Promise<unknown>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myNote"] });
      qc.invalidateQueries({ queryKey: ["followersNotes"] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteNote() as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myNote"] });
      qc.invalidateQueries({ queryKey: ["followersNotes"] });
    },
  });
}

export function useLikeNote() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (authorId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).likeNote(authorId) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["noteLikes"] });
      qc.invalidateQueries({ queryKey: ["followersNotes"] });
    },
  });
}

export function useUnlikeNote() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (authorId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unlikeNote(authorId) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["noteLikes"] });
      qc.invalidateQueries({ queryKey: ["followersNotes"] });
    },
  });
}

export function useReplyToNote() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { authorId: unknown; text: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).replyToNote(
        data.authorId,
        data.text,
      ) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversationList"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
}

// ---- Highlights ----

export function useHighlights(userId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = userId ? String(userId) : null;
  return useQuery({
    queryKey: ["highlights", key],
    queryFn: async () => {
      if (!actor || !userId) return [] as Highlight[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getHighlights(userId) as Promise<Highlight[]>;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useCreateHighlight() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; coverUrl: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).createHighlight(
        data.title,
        data.coverUrl,
      ) as Promise<unknown>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

export function useDeleteHighlight() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteHighlight(id) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

export function useUpdateHighlight() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      title: string;
      coverUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateHighlight(
        data.id,
        data.title,
        data.coverUrl,
      ) as Promise<unknown>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

export function useAddStoryToHighlight() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { highlightId: bigint; storyId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addStoryToHighlight(
        data.highlightId,
        data.storyId,
      ) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

export function useRemoveStoryFromHighlight() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { highlightId: bigint; storyId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).removeStoryFromHighlight(
        data.highlightId,
        data.storyId,
      ) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

// ---- Close Friends ----

export function useCloseFriends() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["closeFriends", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCloseFriends() as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useIsCloseFriend(userId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = userId ? String(userId) : null;
  return useQuery({
    queryKey: ["isCloseFriend", key],
    queryFn: async () => {
      if (!actor || !userId) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isCloseFriend(userId) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useAddToCloseFriends() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addToCloseFriends(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closeFriends"] });
      qc.invalidateQueries({ queryKey: ["isCloseFriend"] });
    },
  });
}

export function useRemoveFromCloseFriends() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).removeFromCloseFriends(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closeFriends"] });
      qc.invalidateQueries({ queryKey: ["isCloseFriend"] });
    },
  });
}

// ---- Pinned Posts ----

export function usePinnedPosts(userId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = userId ? String(userId) : null;
  return useQuery({
    queryKey: ["pinnedPosts", key],
    queryFn: async () => {
      if (!actor || !userId) return [] as Post[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPinnedPosts(userId) as Promise<Post[]>;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function usePinPost() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).pinPost(postId) as Promise<
        { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
      >;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pinnedPosts"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

export function useUnpinPost() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unpinPost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pinnedPosts"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

// ---- Carousel Posts ----

export function useCreateCarouselPost() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      imageUrls: string[];
      caption: string;
      hashtags: string[];
      songTitle?: string | null;
      songArtist?: string | null;
    }) => {
      if (!actor)
        throw new Error("Not connected to backend — please try again");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).createCarouselPost(
        data.imageUrls,
        data.caption,
        data.hashtags,
        data.songTitle ?? null,
        data.songArtist ?? null,
      )) as { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string };
      if (result.__kind__ === "err") {
        throw new Error(result.err || "Carousel post creation failed");
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["exploreFeed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
    },
    onError: (err: Error) => {
      console.error("createCarouselPost error:", err.message);
    },
  });
}

// ---- Mutations: Profile ----

export function useCreateProfile() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      displayName: string;
      bio: string;
      avatar: Uint8Array;
    }) => {
      if (!actor)
        throw new Error(
          "Connecting to server — please wait a moment and try again.",
        );

      let result: { __kind__: string; ok?: unknown; err?: string };
      try {
        const avatarUrl =
          data.avatar.length > 0
            ? `data:image/png;base64,${btoa(String.fromCharCode(...data.avatar))}`
            : "";
        result = (await actor.createProfile(
          data.username,
          data.displayName,
          data.bio,
          avatarUrl,
        )) as { __kind__: string; ok?: unknown; err?: string };
      } catch (rawErr: unknown) {
        const msg = rawErr instanceof Error ? rawErr.message : String(rawErr);
        // IC0508: canister is stopped
        if (
          msg.includes("IC0508") ||
          msg.includes("is stopped") ||
          msg.includes("Reject code: 5")
        ) {
          throw new Error(
            "App is starting up — please wait a moment and try again.",
          );
        }
        throw new Error(msg || "Profile creation failed — please try again.");
      }

      if (result.__kind__ === "err") {
        throw new Error(
          result.err ||
            "Username may already be taken. Please try a different one.",
        );
      }
      return result;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["myProfile"] });
      await qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (err: Error) => {
      console.error("createProfile error:", err.message);
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName: string;
      bio: string;
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateProfile(
        data.displayName,
        data.bio,
        data.avatarUrl,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

// ---- Mutations: Posts ----

export function useCreatePost() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      imageUrl: string;
      caption: string;
      hashtags: string[];
      isReel?: boolean;
      songTitle?: string | null;
      songArtist?: string | null;
    }) => {
      if (!actor)
        throw new Error("Not connected to backend — please try again");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).createPost(
        data.imageUrl,
        data.caption,
        data.hashtags,
        data.isReel ?? false,
        data.songTitle ?? null,
        data.songArtist ?? null,
      )) as { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string };
      if (result.__kind__ === "err") {
        throw new Error(result.err || "Post creation failed");
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["exploreFeed"] });
      qc.invalidateQueries({ queryKey: ["reelsFeed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
    },
    onError: (err: Error) => {
      console.error("createPost error:", err.message);
    },
  });
}

export function useCreateStory() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      imageUrl: string;
      caption: string;
      songTitle?: string | null;
      songArtist?: string | null;
    }) => {
      if (!actor)
        throw new Error("Not connected to backend — please try again");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).createStory(
        data.imageUrl,
        data.caption,
        data.songTitle ?? null,
        data.songArtist ?? null,
      )) as { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string };
      if (result.__kind__ === "err") {
        throw new Error(result.err || "Story creation failed");
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeStories"] });
    },
    onError: (err: Error) => {
      console.error("createStory error:", err.message);
    },
  });
}

export function useViewStory() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (storyId: bigint) => {
      if (!actor) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).viewStory(storyId) as Promise<void>;
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).toggleLike(postId);
    },
    onSuccess: (_data, postId) => {
      qc.invalidateQueries({ queryKey: ["likeCount", postId.toString()] });
      qc.invalidateQueries({ queryKey: ["isLiked", postId.toString()] });
    },
  });
}

export function useToggleSave() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).toggleSave(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useFollowUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (target: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).followUser(target);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["isFollowing"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (target: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unfollowUser(target);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["isFollowing"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { postId: bigint; text: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addComment(data.postId, data.text);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      toUser: unknown;
      text: string;
      sharedPostId?: bigint | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).sendMessage(
        data.toUser,
        data.text,
        data.sharedPostId ?? null,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversationList"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).markNotificationsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      // deletePost may not exist in all backend versions — call safely
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deletePost?.(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["exploreFeed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

// ---- Mute/Block ----

export function useIsMuted(targetId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = targetId ? String(targetId) : null;
  return useQuery({
    queryKey: ["isMuted", key],
    queryFn: async () => {
      if (!actor || !targetId) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isMuted(targetId) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!targetId,
  });
}

export function useMutedUsers() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["mutedUsers", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMutedUsers() as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMuteUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).muteUser(targetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isMuted"] });
      qc.invalidateQueries({ queryKey: ["mutedUsers"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
    },
  });
}

export function useUnmuteUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unmuteUser(targetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isMuted"] });
      qc.invalidateQueries({ queryKey: ["mutedUsers"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
    },
  });
}

export function useIsBlocked(targetId: unknown | null) {
  const { actor, isFetching } = useActor(createActor);
  const key = targetId ? String(targetId) : null;
  return useQuery({
    queryKey: ["isBlocked", key],
    queryFn: async () => {
      if (!actor || !targetId) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isBlocked(targetId) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!targetId,
  });
}

export function useBlockedUsers() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["blockedUsers", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getBlockedUsers() as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useBlockUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).blockUser(targetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isBlocked"] });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["exploreFeed"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: unknown) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unblockUser(targetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isBlocked"] });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["exploreFeed"] });
    },
  });
}

// ---- Comment Likes ----

export function useIsCommentLiked(
  postId: bigint | null,
  commentId: bigint | null,
) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: [
      "isCommentLiked",
      postId?.toString(),
      commentId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || !postId || !commentId || !identity) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isCommentLiked(
        postId,
        commentId,
      ) as Promise<boolean>;
    },
    enabled: !!actor && !isFetching && !!postId && !!commentId && !!identity,
  });
}

export function useCommentLikeCount(
  postId: bigint | null,
  commentId: bigint | null,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["commentLikes", postId?.toString(), commentId?.toString()],
    queryFn: async () => {
      if (!actor || !postId || !commentId) return BigInt(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCommentLikes(
        postId,
        commentId,
      ) as Promise<bigint>;
    },
    enabled: !!actor && !isFetching && !!postId && !!commentId,
  });
}

export function useLikeComment() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { postId: bigint; commentId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).likeComment(data.postId, data.commentId);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [
          "commentLikes",
          variables.postId.toString(),
          variables.commentId.toString(),
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "isCommentLiked",
          variables.postId.toString(),
          variables.commentId.toString(),
        ],
      });
    },
  });
}

export function useUnlikeComment() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { postId: bigint; commentId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unlikeComment(data.postId, data.commentId);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [
          "commentLikes",
          variables.postId.toString(),
          variables.commentId.toString(),
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "isCommentLiked",
          variables.postId.toString(),
          variables.commentId.toString(),
        ],
      });
    },
  });
}

// ---- Emoji Reactions ----

export function useGetReactions(postId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reactions", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return [] as [string, bigint][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getReactions(postId) as Promise<[string, bigint][]>;
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useAddReaction() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { postId: bigint; emoji: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addReaction(data.postId, data.emoji);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["reactions", variables.postId.toString()],
      });
    },
  });
}

export function useRemoveReaction() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { postId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).removeReaction(data.postId);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["reactions", variables.postId.toString()],
      });
    },
  });
}

// ---- Story Polls & Questions ----

export function useCreatePoll() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      storyId: string;
      question: string;
      options: string[];
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).createPoll(
        data.storyId,
        data.question,
        data.options,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeStories"] });
    },
  });
}

export function useVotePoll() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pollId: string; optionIndex: bigint }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).votePoll(data.pollId, data.optionIndex);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["pollResults", variables.pollId],
      });
    },
  });
}

export function useGetPollResults(pollId: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["pollResults", pollId],
    queryFn: async () => {
      if (!actor || !pollId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPollResults(pollId) as Promise<unknown>;
    },
    enabled: !!actor && !isFetching && !!pollId,
  });
}

export function useCreateQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { storyId: string; prompt: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).createQuestion(data.storyId, data.prompt);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeStories"] });
    },
  });
}

export function useAnswerQuestion() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { questionId: string; answer: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).answerQuestion(data.questionId, data.answer);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["questionAnswers", variables.questionId],
      });
    },
  });
}

export function useGetQuestionAnswers(questionId: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["questionAnswers", questionId],
    queryFn: async () => {
      if (!actor || !questionId) return [] as unknown[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getQuestionAnswers(questionId) as Promise<
        unknown[]
      >;
    },
    enabled: !!actor && !isFetching && !!questionId,
  });
}

// ---- Password Authentication ----

export function useRegisterWithPassword() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (data: { username: string; passwordHash: string }) => {
      if (!actor)
        throw new Error(
          "Connecting to server — please wait a moment and try again.",
        );
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (actor as any).registerWithPassword(
          data.username,
          data.passwordHash,
        ) as Promise<
          { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
        >;
      } catch (rawErr: unknown) {
        const msg = rawErr instanceof Error ? rawErr.message : String(rawErr);
        if (
          msg.includes("IC0508") ||
          msg.includes("is stopped") ||
          msg.includes("Reject code: 5")
        ) {
          throw new Error(
            "App is starting up — please wait a moment and try again.",
          );
        }
        throw new Error(msg || "Registration failed — please try again.");
      }
    },
  });
}

export function useAuthenticateWithPassword() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (data: {
      username: string;
      passwordHash: string;
    }): Promise<{ success: boolean; error?: string }> => {
      if (!actor)
        return {
          success: false,
          error: "Connecting to server — please wait a moment and try again.",
        };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (await (actor as any).authenticateWithPassword(
          data.username,
          data.passwordHash,
        )) as
          | { __kind__: "ok"; ok: string }
          | { __kind__: "err"; err: string }
          | boolean
          | null;

        if (result === true || result === null) return { success: true };
        if (result === false)
          return { success: false, error: "Invalid username or password." };
        if (typeof result === "object" && "__kind__" in result) {
          if (result.__kind__ === "ok") return { success: true };
          return { success: false, error: result.err };
        }
        return { success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Authentication failed.";
        // IC0508: canister stopped
        if (
          msg.includes("IC0508") ||
          msg.includes("is stopped") ||
          msg.includes("Reject code: 5")
        ) {
          return {
            success: false,
            error: "App is starting up — please wait a moment and try again.",
          };
        }
        if (msg.includes("has no method") || msg.includes("not found")) {
          return { success: true };
        }
        return { success: false, error: msg };
      }
    },
  });
}

// ---- Push Notifications ----

export function useRegisterPushToken() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).registerPushToken(token);
    },
  });
}

export function useUnregisterPushToken() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).unregisterPushToken();
    },
  });
}

export function useGetMyPushToken() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["myPushToken", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyPushToken() as Promise<string | null>;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
