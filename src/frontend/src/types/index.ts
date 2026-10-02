import type { Principal } from "@icp-sdk/core/principal";

export type { Principal };

export interface UserProfile {
  id: Principal;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  createdAt: bigint;
}

export interface Post {
  id: bigint;
  author: Principal;
  imageUrl: string;
  imageUrls: string[];
  caption: string;
  hashtags: string[];
  createdAt: bigint;
  isPinned?: boolean;
}

export interface Story {
  id: bigint;
  author: Principal;
  imageUrl: string;
  caption: string;
  createdAt: bigint;
  songTitle?: string;
  songArtist?: string;
}

export interface Comment {
  id: bigint;
  postId: bigint;
  author: Principal;
  text: string;
  createdAt: bigint;
}

export interface Message {
  id: bigint;
  fromUser: Principal;
  toUser: Principal;
  text: string;
  createdAt: bigint;
}

export interface Notification {
  id: bigint;
  toUser: Principal;
  fromUser: Principal;
  kind: string;
  postId?: bigint;
  isRead: boolean;
  createdAt: bigint;
}

export interface ActivityStatus {
  lastSeen: bigint;
  isOnline: boolean;
}

export enum NoteAudience {
  MutualFollowers = "MutualFollowers",
  CloseFriends = "CloseFriends",
}

export interface Note {
  id: bigint;
  author: Principal;
  text: string;
  audience: NoteAudience;
  createdAt: bigint;
  expiresAt: bigint;
}

export interface NoteWithAuthor {
  note: Note;
  /** Backend field — use this for the author profile */
  authorProfile?: UserProfile;
  /** Alias for backward compat — same as authorProfile */
  author?: UserProfile;
  likeCount: bigint;
  likedByMe?: boolean;
}

export interface Highlight {
  id: bigint;
  owner: Principal;
  title: string;
  coverUrl: string;
  storyIds: bigint[];
  createdAt: bigint;
}

export interface ConversationSummary {
  otherUser: Principal;
  lastMessage?: Message;
  unreadCount: number;
}
