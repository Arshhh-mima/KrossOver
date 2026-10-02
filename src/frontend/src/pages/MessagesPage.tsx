import { BottomDock, Header } from "@/components/Navigation";
import { NotesBar } from "@/components/NotesBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActivityStatusBatch,
  useAllUsers,
  useConversation,
  useConversationList,
  useMyProfile,
  useSearchUsers,
  useSendMessage,
} from "@/hooks/useQueries";
import { timeAgo } from "@/lib/time";
import type { ActivityStatus, UserProfile } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function formatActivityStatus(status: ActivityStatus | null | undefined): {
  label: string;
  isOnline: boolean;
} {
  if (!status) return { label: "", isOnline: false };
  if (status.isOnline) return { label: "Active now", isOnline: true };
  const ms = Number(status.lastSeen / BigInt(1_000_000));
  if (ms <= 0) return { label: "", isOnline: false };
  const label = `Active ${formatDistanceToNow(new Date(ms), { addSuffix: true })}`;
  return { label, isOnline: false };
}

function ActiveDot({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null;
  return (
    <span
      className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card"
      aria-label="Active now"
    />
  );
}

/** Parse [post:ID] from a message and return a thumbnail card */
function PostPreviewInMessage({ text }: { text: string }) {
  const postIdMatch = text.match(/\[post:(\d+)\]/);
  if (!postIdMatch) return <p className="text-[13px] leading-snug">{text}</p>;

  const beforeText = text.replace(/\[post:\d+\]/, "").trim();
  return (
    <div className="space-y-1">
      {beforeText && <p className="text-[13px] leading-snug">{beforeText}</p>}
      <div className="flex items-center gap-2 bg-black/20 rounded-xl p-2 mt-1">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Shared a post</p>
          <p className="text-[12px] font-medium truncate">
            View post #{postIdMatch[1].slice(-6)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { identity, login } = useInternetIdentity();
  const { data: myProfile } = useMyProfile();
  const { data: conversationPrincipals = [], isLoading: convListLoading } =
    useConversationList();
  const { data: allUsers = [] } = useAllUsers();
  const [selectedPrincipal, setSelectedPrincipal] = useState<unknown | null>(
    null,
  );
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { data: searchResults = [] } = useSearchUsers(searchQuery);
  const sendMessage = useSendMessage();

  // Ref for the Radix ScrollArea viewport (messages area)
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  // Anchor div at the bottom of messages list
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of allUsers) map.set(u.id.toString(), u);
    return map;
  }, [allUsers]);

  const { data: messages = [], isLoading: msgLoading } =
    useConversation(selectedPrincipal);

  // Scroll to bottom when messages change — works with Radix ScrollArea
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll-to-bottom
  useEffect(() => {
    // Try the anchor div first (works if scrollIntoView is supported on the viewport)
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
    // Also manually scroll the Radix viewport element
    if (messagesViewportRef.current) {
      const viewport = messagesViewportRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement | null;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages]);

  const selectedProfile = selectedPrincipal
    ? (profileMap.get(String(selectedPrincipal)) ?? null)
    : null;

  const conversationUsers = conversationPrincipals
    .map((p) => profileMap.get(String(p)))
    .filter((u): u is UserProfile => !!u);

  const allConvUsers =
    selectedProfile &&
    !conversationUsers.find(
      (u) => u.id.toString() === String(selectedPrincipal),
    )
      ? [selectedProfile, ...conversationUsers]
      : conversationUsers;

  const convUserIds = allConvUsers.map((u) => u.id);
  const { data: activityBatch = [] } = useActivityStatusBatch(convUserIds);

  const activityMap = useMemo(() => {
    const map = new Map<string, ActivityStatus>();
    for (const [principal, status] of activityBatch) {
      map.set(String(principal), status);
    }
    return map;
  }, [activityBatch]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPrincipal) return;
    try {
      await sendMessage.mutateAsync({
        toUser: selectedPrincipal,
        text: newMessage.trim(),
      });
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const startConversation = (user: UserProfile) => {
    setSelectedPrincipal(user.id);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleCallClick = () => {
    toast.info("Call feature coming soon", {
      description:
        "Voice and video calls will be available in a future update.",
      duration: 4000,
    });
  };

  if (!identity) {
    return (
      <div className="page-bg min-h-screen" data-ocid="messages.page">
        <Header />
        <main
          className="max-w-lg mx-auto px-4 pt-16 pb-28 text-center"
          data-ocid="messages.empty_state"
        >
          <MessageCircle className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-[20px] font-bold text-foreground mb-2">
            Your Messages
          </h2>
          <p className="text-muted-foreground text-[14px] mb-6">
            Sign in to send and receive messages.
          </p>
          <Button
            onClick={login}
            className="gold-btn px-6 py-2 rounded-full font-semibold"
            data-ocid="messages.login.primary_button"
          >
            Sign In
          </Button>
        </main>
        <BottomDock />
      </div>
    );
  }

  const selectedActivity = selectedPrincipal
    ? activityMap.get(String(selectedPrincipal))
    : undefined;
  const selectedStatus = formatActivityStatus(selectedActivity);

  return (
    <div className="page-bg min-h-screen" data-ocid="messages.page">
      <Header />
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-28">
        {/* Notes bar at top of DM inbox */}
        <div className="mb-3">
          <NotesBar myProfile={myProfile} />
        </div>

        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Conversations list */}
          <div
            className={`bg-card rounded-2xl card-shadow flex flex-col ${
              selectedPrincipal
                ? "hidden md:flex md:w-72 flex-shrink-0"
                : "flex-1 md:w-72 md:flex-shrink-0"
            }`}
          >
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[16px] text-foreground">
                  Messages
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary text-[12px]"
                  onClick={() => setShowSearch((v) => !v)}
                  data-ocid="messages.new.button"
                >
                  {showSearch ? "Cancel" : "New"}
                </Button>
              </div>

              {showSearch ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl text-[13px] bg-secondary border-0"
                    autoFocus
                    data-ocid="messages.search_input"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-9 rounded-xl text-[13px] bg-secondary border-0"
                    readOnly
                    onClick={() => setShowSearch(true)}
                  />
                </div>
              )}
            </div>

            {/* Scrollable conversation list */}
            <ScrollArea className="flex-1 min-h-0">
              {showSearch ? (
                <div>
                  {searchResults
                    .filter(
                      (u) =>
                        u.id.toString() !== identity.getPrincipal().toString(),
                    )
                    .map((u, i) => (
                      <button
                        key={u.id.toString()}
                        type="button"
                        onClick={() => startConversation(u)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
                        data-ocid={`messages.search.item.${i + 1}`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatarUrl} alt={u.username} />
                          <AvatarFallback className="bg-accent text-xs">
                            {u.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-[13px] truncate">
                            {u.username}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.displayName}
                          </p>
                        </div>
                      </button>
                    ))}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-center text-muted-foreground text-[13px] py-6">
                      No users found
                    </p>
                  )}
                </div>
              ) : convListLoading ? (
                <div className="space-y-1 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allConvUsers.length === 0 ? (
                <div
                  className="p-6 text-center"
                  data-ocid="messages.conversations.empty_state"
                >
                  <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground">
                    No messages yet
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Tap "New" to find people to message
                  </p>
                </div>
              ) : (
                <div data-ocid="messages.conversation.list">
                  {allConvUsers.map((user, i) => {
                    const status = activityMap.get(user.id.toString());
                    const { label, isOnline } = formatActivityStatus(status);
                    const isSelected =
                      String(selectedPrincipal) === user.id.toString();
                    return (
                      <button
                        key={user.id.toString()}
                        type="button"
                        onClick={() => setSelectedPrincipal(user.id)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                          isSelected ? "bg-accent/20" : ""
                        }`}
                        data-ocid={`messages.conversation.item.${i + 1}`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={user.avatarUrl}
                              alt={user.username}
                            />
                            <AvatarFallback className="bg-accent text-sm">
                              {user.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ActiveDot isOnline={isOnline} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-[13px] text-foreground truncate">
                            {user.username}
                          </p>
                          {isOnline ? (
                            <p className="text-[11px] text-green-500 font-medium">
                              Active now
                            </p>
                          ) : label ? (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {label}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {user.displayName}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat view */}
          {selectedPrincipal ? (
            <div
              className="flex-1 bg-card rounded-2xl card-shadow flex flex-col min-w-0 overflow-hidden"
              data-ocid="messages.chat.panel"
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPrincipal(null)}
                  className="md:hidden p-1 hover:bg-secondary rounded-lg transition-colors"
                  data-ocid="messages.chat.back.button"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {selectedProfile ? (
                  <>
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={selectedProfile.avatarUrl}
                          alt={selectedProfile.username}
                        />
                        <AvatarFallback className="bg-accent text-xs">
                          {selectedProfile.displayName
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ActiveDot isOnline={selectedStatus.isOnline} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] truncate">
                        {selectedProfile.username}
                      </p>
                      {selectedStatus.isOnline ? (
                        <p className="text-[11px] text-green-500 font-medium">
                          Active now
                        </p>
                      ) : selectedStatus.label ? (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {selectedStatus.label}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {selectedProfile.displayName}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate">
                      {String(selectedPrincipal).slice(0, 16)}...
                    </p>
                  </div>
                )}

                {/* Call button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-xl flex-shrink-0 hover:bg-secondary transition-colors"
                  onClick={handleCallClick}
                  aria-label="Start call"
                  data-ocid="messages.chat.call.button"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Messages area — fixed height, scrollable */}
              <div
                ref={messagesViewportRef}
                className="flex-1 min-h-0 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-1">
                    {msgLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div
                        className="text-center py-8"
                        data-ocid="messages.chat.empty_state"
                      >
                        <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-[13px] text-muted-foreground">
                          No messages yet. Say hello! 👋
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3" data-ocid="messages.chat.list">
                        {messages.map((msg, i) => {
                          const isMine =
                            msg.fromUser.toString() ===
                            identity.getPrincipal().toString();
                          const hasPostRef = msg.text.includes("[post:");
                          return (
                            <motion.div
                              key={msg.id.toString()}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.02, 0.3) }}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                              data-ocid={`messages.chat.item.${i + 1}`}
                            >
                              {/* Avatar for others */}
                              {!isMine && selectedProfile && (
                                <Avatar className="h-6 w-6 mr-2 self-end flex-shrink-0">
                                  <AvatarImage
                                    src={selectedProfile.avatarUrl}
                                    alt={selectedProfile.username}
                                  />
                                  <AvatarFallback className="text-[8px] bg-accent">
                                    {selectedProfile.displayName
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] ${
                                  isMine
                                    ? "primary-btn rounded-br-sm"
                                    : "bg-secondary text-foreground rounded-bl-sm"
                                } ${hasPostRef ? "w-64" : ""}`}
                              >
                                <PostPreviewInMessage text={msg.text} />
                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMine
                                      ? "text-white/60 text-right"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {timeAgo(msg.createdAt)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                        {/* Scroll anchor */}
                        <div ref={chatBottomRef} className="h-px" />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border flex items-center gap-2 flex-shrink-0">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000)
                      setNewMessage(e.target.value);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Message..."
                  className="flex-1 rounded-xl text-[14px]"
                  maxLength={1000}
                  data-ocid="messages.chat.input"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  className="gold-btn rounded-xl h-9 w-9 flex-shrink-0"
                  aria-label="Send message"
                  data-ocid="messages.chat.submit_button"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="hidden md:flex flex-1 bg-card rounded-2xl card-shadow items-center justify-center"
              data-ocid="messages.chat.empty_state"
            >
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Your messages</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Select a conversation or tap "New" to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomDock />
    </div>
  );
}
