import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface NoteWithAuthor {
    likeCount: bigint;
    note: Note;
    authorProfile?: UserProfile;
}
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    createdAt: bigint;
    text: string;
    author: UserId;
    postId: PostId;
}
export interface ActivityStatus {
    isOnline: boolean;
    lastSeen: bigint;
}
export type PostId = bigint;
export interface Story {
    id: StoryId;
    songArtist?: string;
    songTitle?: string;
    createdAt: bigint;
    author: UserId;
    imageUrl: string;
    caption: string;
}
export type StoryId = bigint;
export interface Highlight {
    id: HighlightId;
    title: string;
    owner: UserId;
    createdAt: bigint;
    coverUrl: string;
    storyIds: Array<StoryId>;
}
export interface StoryWithUser {
    story: Story;
    authorProfile?: UserProfile;
}
export type UserId = Principal;
export interface DeviceInfo {
    deviceLabel: string;
    addedAt: bigint;
    deviceId: string;
    principalId: string;
}
export type MessageId = bigint;
export interface Post {
    id: PostId;
    songArtist?: string;
    hashtags: Array<string>;
    imageUrls: Array<string>;
    songTitle?: string;
    createdAt: bigint;
    isReel: boolean;
    author: UserId;
    imageUrl: string;
    caption: string;
}
export type NotificationId = bigint;
export interface Notification {
    id: NotificationId;
    kind: string;
    createdAt: bigint;
    isRead: boolean;
    toUser: UserId;
    fromUser: UserId;
    postId?: PostId;
}
export interface Message {
    id: MessageId;
    createdAt: bigint;
    text: string;
    toUser: UserId;
    fromUser: UserId;
    sharedPostId?: PostId;
}
export type HighlightId = bigint;
export interface ConversationSummary {
    userId: UserId;
    lastMessage?: Message;
    profile?: UserProfile;
}
export interface UserProfile {
    id: UserId;
    bio: string;
    username: string;
    displayName: string;
    createdAt: bigint;
    avatarUrl: string;
}
export interface Note {
    expiresAt: bigint;
    createdAt: bigint;
    text: string;
    audience: NoteAudience;
    author: UserId;
}
export enum NoteAudience {
    MutualFollowers = "MutualFollowers",
    CloseFriends = "CloseFriends"
}
export interface backendInterface {
    addComment(postId: PostId, text: string): Promise<{
        __kind__: "ok";
        ok: CommentId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addQuestion(storyId: string, questionText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addReaction(postId: PostId, emoji: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addStoryToHighlight(highlightId: HighlightId, storyId: StoryId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addToCloseFriends(userId: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    answerQuestion(questionId: string, answer: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    authenticateWithPassword(username: string, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    blockUser(targetUserId: UserId): Promise<void>;
    createCarouselPost(imageUrls: Array<string>, caption: string, hashtags: Array<string>, songTitle: string | null, songArtist: string | null): Promise<{
        __kind__: "ok";
        ok: PostId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createHighlight(title: string, coverUrl: string): Promise<{
        __kind__: "ok";
        ok: HighlightId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createNote(content: string, audience: NoteAudience): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPoll(storyId: string, question: string, options: Array<string>): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPost(imageUrl: string, caption: string, hashtags: Array<string>, songTitle: string | null, songArtist: string | null, isReel: boolean): Promise<{
        __kind__: "ok";
        ok: PostId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createProfile(username: string, displayName: string, bio: string, avatarUrl: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createQuestion(storyId: string, questionText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createStory(imageUrl: string, caption: string, songTitle: string | null, songArtist: string | null): Promise<{
        __kind__: "ok";
        ok: StoryId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteHighlight(id: HighlightId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteNote(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    downloadFile(_fileId: string): Promise<{
        __kind__: "ok";
        ok: Uint8Array;
    } | {
        __kind__: "err";
        err: string;
    }>;
    followUser(target: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActiveStories(): Promise<Array<StoryWithUser>>;
    getActivityStatus(userId: UserId): Promise<ActivityStatus>;
    getActivityStatusBatch(userIds: Array<UserId>): Promise<Array<[UserId, ActivityStatus]>>;
    getAllSetways(): Promise<Array<string>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getBlockedUsers(): Promise<Array<UserId>>;
    getCloseFriends(): Promise<Array<UserProfile>>;
    getCommentLikes(postId: PostId, commentId: bigint): Promise<bigint>;
    getComments(postId: PostId): Promise<Array<Comment>>;
    getConversation(otherUserId: UserId): Promise<Array<Message>>;
    getConversationList(): Promise<Array<ConversationSummary>>;
    getExploreFeed(): Promise<Array<Post>>;
    getFollowers(uid: UserId): Promise<Array<UserProfile>>;
    getFollowersNotes(): Promise<Array<NoteWithAuthor>>;
    getFollowing(uid: UserId): Promise<Array<UserProfile>>;
    getHighlights(uid: UserId): Promise<Array<Highlight>>;
    getHomeFeed(): Promise<Array<Post>>;
    getLikeCount(postId: PostId): Promise<bigint>;
    getMutedUsers(): Promise<Array<UserId>>;
    getMyDevices(): Promise<Array<DeviceInfo>>;
    getMyNote(): Promise<Note | null>;
    getMyProfile(): Promise<UserProfile | null>;
    getMyPushToken(): Promise<string | null>;
    getNoteLikes(authorId: UserId): Promise<Array<Principal>>;
    getNotifications(): Promise<Array<Notification>>;
    getPasswordUserPrincipal(username: string): Promise<string | null>;
    getPinnedPosts(uid: UserId): Promise<Array<Post>>;
    getPollResults(pollId: string): Promise<{
        userVote?: bigint;
        question: string;
        votes: Array<bigint>;
        options: Array<string>;
    } | null>;
    getPost(id: PostId): Promise<Post | null>;
    getPostImages(postId: PostId): Promise<Array<string>>;
    getPostsByUser(uid: UserId): Promise<Array<Post>>;
    getProfile(uid: UserId): Promise<UserProfile | null>;
    getProfileByUsername(username: string): Promise<UserProfile | null>;
    getQuestionAnswers(questionId: string): Promise<Array<{
        answerer: string;
        answer: string;
        timestamp: bigint;
    }>>;
    getReactions(postId: PostId): Promise<Array<[string, bigint]>>;
    getReelsFeed(limit: bigint, offset: bigint): Promise<Array<Post>>;
    getSavedPosts(): Promise<Array<Post>>;
    getStories(uid: UserId): Promise<Array<Story>>;
    getStory(storyId: StoryId): Promise<Story | null>;
    getTrendingHashtags(limit: bigint): Promise<Array<[string, bigint]>>;
    isBlocked(targetUserId: UserId): Promise<boolean>;
    isCloseFriend(userId: UserId): Promise<boolean>;
    isCommentLiked(postId: PostId, commentId: bigint): Promise<boolean>;
    isDeviceRegistered(deviceId: string): Promise<boolean>;
    isFollowing(target: UserId): Promise<boolean>;
    isLiked(postId: PostId): Promise<boolean>;
    isMuted(targetUserId: UserId): Promise<boolean>;
    likeComment(postId: PostId, commentId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    likeNote(authorId: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markNotificationsRead(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    muteUser(targetUserId: UserId): Promise<void>;
    pinPost(postId: PostId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerDevice(deviceId: string, deviceLabel: string): Promise<boolean>;
    registerPushToken(token: string): Promise<void>;
    registerWithPassword(username: string, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeDevice(deviceId: string): Promise<boolean>;
    removeFromCloseFriends(userId: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeReaction(postId: PostId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeStoryFromHighlight(highlightId: HighlightId, storyId: StoryId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    replyToNote(authorId: UserId, replyText: string): Promise<{
        __kind__: "ok";
        ok: MessageId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    searchByHashtag(hashtag: string): Promise<Array<Post>>;
    searchUsers(q: string): Promise<Array<UserProfile>>;
    sendMessage(recipientId: UserId, content: string, sharedPostId: PostId | null): Promise<{
        __kind__: "ok";
        ok: MessageId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleLike(postId: PostId): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleSave(postId: PostId): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unblockUser(targetUserId: UserId): Promise<void>;
    unfollowUser(target: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unlikeComment(postId: PostId, commentId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unlikeNote(authorId: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unmuteUser(targetUserId: UserId): Promise<void>;
    unpinPost(postId: PostId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unregisterPushToken(): Promise<void>;
    updateActivityStatus(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateHighlight(id: HighlightId, title: string, coverUrl: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProfile(displayName: string, bio: string, avatarUrl: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadFile(_name: string, _mime: string, _data: Uint8Array): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    viewStory(storyId: StoryId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    votePoll(pollId: string, optionIndex: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
