import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Array "mo:core/Array";





actor KrossOver {

  // ─── Types ───────────────────────────────────────────────────────────────────

  type UserId = Principal;
  type PostId = Nat;
  type StoryId = Nat;
  type CommentId = Nat;
  type MessageId = Nat;
  type NotificationId = Nat;
  type HighlightId = Nat;

  type UserProfile = {
    id : UserId;
    username : Text;
    displayName : Text;
    bio : Text;
    avatarUrl : Text;
    createdAt : Int;
  };

  type Post = {
    id : PostId;
    author : UserId;
    imageUrl : Text;
    imageUrls : [Text];
    caption : Text;
    hashtags : [Text];
    songTitle : ?Text;
    songArtist : ?Text;
    isReel : Bool;
    createdAt : Int;
  };

  type Story = {
    id : StoryId;
    author : UserId;
    imageUrl : Text;
    caption : Text;
    songTitle : ?Text;
    songArtist : ?Text;
    createdAt : Int;
  };

  type StoryWithUser = {
    story : Story;
    authorProfile : ?UserProfile;
  };

  type Comment = {
    id : CommentId;
    postId : PostId;
    author : UserId;
    text : Text;
    createdAt : Int;
  };

  type Message = {
    id : MessageId;
    fromUser : UserId;
    toUser : UserId;
    text : Text;
    sharedPostId : ?PostId;
    createdAt : Int;
  };

  type ConversationSummary = {
    userId : UserId;
    profile : ?UserProfile;
    lastMessage : ?Message;
  };

  type Notification = {
    id : NotificationId;
    toUser : UserId;
    fromUser : UserId;
    kind : Text;
    postId : ?PostId;
    isRead : Bool;
    createdAt : Int;
  };

  type NoteAudience = { #MutualFollowers; #CloseFriends };

  type Note = {
    author : UserId;
    text : Text;
    audience : NoteAudience;
    createdAt : Int;
    expiresAt : Int;
  };

  type NoteWithAuthor = {
    note : Note;
    authorProfile : ?UserProfile;
    likeCount : Nat;
  };

  type Highlight = {
    id : HighlightId;
    owner : UserId;
    title : Text;
    coverUrl : Text;
    storyIds : [StoryId];
    createdAt : Int;
  };

  type ActivityStatus = {
    lastSeen : Int;
    isOnline : Bool;
  };

  // ─── Poll / Question sticker types ───────────────────────────────────────────

  type Poll = {
    id : Text;
    storyId : Text;
    question : Text;
    options : [Text];
    createdBy : UserId;
    createdAt : Int;
  };

  type QuestionSticker = {
    id : Text;
    storyId : Text;
    questionText : Text;
    createdBy : UserId;
    createdAt : Int;
  };

  type QuestionAnswer = {
    answerer : Text;
    answer : Text;
    timestamp : Int;
  };

  // ─── Counters ────────────────────────────────────────────────────────────────

  var nextPostId : PostId = 0;
  var nextStoryId : StoryId = 0;
  var nextCommentId : CommentId = 0;
  var nextMessageId : MessageId = 0;
  var nextNotifId : NotificationId = 0;
  var nextHighlightId : HighlightId = 0;

  // ─── Core storage ────────────────────────────────────────────────────────────

  let profiles = Map.empty<UserId, UserProfile>();
  let posts = Map.empty<PostId, Post>();
  let stories = Map.empty<StoryId, Story>();
  let comments = Map.empty<CommentId, Comment>();
  let messages = Map.empty<MessageId, Message>();
  let notifications = Map.empty<NotificationId, Notification>();
  let follows = Map.empty<UserId, Set.Set<UserId>>();
  let likes = Map.empty<PostId, Set.Set<UserId>>();
  let saves = Map.empty<UserId, Set.Set<PostId>>();
  let storyViews = Map.empty<StoryId, Set.Set<UserId>>();
  let usernameIndex = Map.empty<Text, UserId>();

  // ─── Notes (one per user, keyed by author) ────────────────────────────────

  let notes = Map.empty<UserId, Note>();
  // noteLikes keyed by author Principal (since one note per user)
  let noteLikes = Map.empty<UserId, Set.Set<UserId>>();

  // ─── Close friends ───────────────────────────────────────────────────────────

  let closeFriends = Map.empty<UserId, Set.Set<UserId>>();

  // ─── Highlights ──────────────────────────────────────────────────────────────

  let highlights = Map.empty<HighlightId, Highlight>();
  let userHighlights = Map.empty<UserId, [HighlightId]>();

  // ─── Activity status ─────────────────────────────────────────────────────────

  let activityStatus = Map.empty<UserId, Int>();
  let onlineThreshold : Int = 300_000_000_000; // 5 minutes in nanoseconds

  // ─── Pinned posts ─────────────────────────────────────────────────────────────

  let pinnedPosts = Map.empty<UserId, [PostId]>();

  // ─── Mute / Block ────────────────────────────────────────────────────────────

  let mutedUsers = Map.empty<UserId, Set.Set<UserId>>();
  let blockedUsers = Map.empty<UserId, Set.Set<UserId>>();

  // ─── Trending hashtags ────────────────────────────────────────────────────────
  // Maps normalized hashtag → post count

  let hashtagCounts = Map.empty<Text, Nat>();

  // ─── Comment likes ────────────────────────────────────────────────────────────
  // Key: (postId, commentId) encoded as Text "postId:commentId"

  let commentLikes = Map.empty<Text, Set.Set<UserId>>();

  // ─── Post emoji reactions ─────────────────────────────────────────────────────
  // reactions: postId → Map<emoji, Set<UserId>>
  // userReactions: postId → Map<UserId, emoji> (one reaction per user)

  let reactions = Map.empty<PostId, Map.Map<Text, Set.Set<UserId>>>();
  let userReactions = Map.empty<PostId, Map.Map<UserId, Text>>();

  // ─── Device registry ─────────────────────────────────────────────────────────

  type DeviceInfo = {
    deviceId : Text;
    deviceLabel : Text;
    addedAt : Int;
    principalId : Text;
  };

  // userDevices: userId → Map<deviceId, DeviceInfo>
  let userDevices = Map.empty<UserId, Map.Map<Text, DeviceInfo>>();

  // ─── Password authentication ──────────────────────────────────────────────────

  type PasswordUser = {
    passwordHash : Text;
    principalText : Text;
  };

  // keyed by username.toLower()
  let passwordUsers = Map.empty<Text, PasswordUser>();

  // ─── Push notification tokens ─────────────────────────────────────────────────

  let pushTokens = Map.empty<UserId, Text>();

  // ─── Story sticker counters ───────────────────────────────────────────────────

  var nextPollId : Nat = 0;
  var nextQuestionId : Nat = 0;

  let polls = Map.empty<Text, Poll>();
  // pollVotes: pollId → Map<UserId, optionIndex>
  let pollVotes = Map.empty<Text, Map.Map<UserId, Nat>>();

  let questions = Map.empty<Text, QuestionSticker>();
  // questionAnswers: questionId → [QuestionAnswer]
  let questionAnswers = Map.empty<Text, [QuestionAnswer]>();

  // ─── Internal helpers ────────────────────────────────────────────────────────

  func mapVals<K, V>(m : Map.Map<K, V>) : [V] {
    m.values().toArray()
  };

  func postOrder(a : Post, b : Post) : { #less; #equal; #greater } {
    if (a.createdAt > b.createdAt) #less
    else if (a.createdAt < b.createdAt) #greater
    else #equal
  };

  func pushNotif(toUser : UserId, fromUser : UserId, kind : Text, postId : ?PostId) {
    if (toUser == fromUser) return;
    let id = nextNotifId;
    notifications.add(id, {
      id;
      toUser;
      fromUser;
      kind;
      postId;
      isRead = false;
      createdAt = Time.now();
    });
    nextNotifId += 1;
  };

  func getFollowSet(uid : UserId) : Set.Set<UserId> {
    switch (follows.get(uid)) {
      case (?s) s;
      case null Set.empty<UserId>();
    }
  };

  func getMuteSet(uid : UserId) : Set.Set<UserId> {
    switch (mutedUsers.get(uid)) {
      case (?s) s;
      case null Set.empty<UserId>();
    }
  };

  func getBlockSet(uid : UserId) : Set.Set<UserId> {
    switch (blockedUsers.get(uid)) {
      case (?s) s;
      case null Set.empty<UserId>();
    }
  };

  // Returns true if blocker has blocked target, OR target has blocked blocker
  func _isBlockedEither(a : UserId, b : UserId) : Bool {
    getBlockSet(a).contains(b) or getBlockSet(b).contains(a)
  };

  func trackHashtags(hashtags : [Text]) {
    for (ht in hashtags.values()) {
      let key = ht.toLower();
      let current = switch (hashtagCounts.get(key)) {
        case (?n) n;
        case null 0;
      };
      hashtagCounts.add(key, current + 1);
    };
  };

  func commentLikeKey(postId : PostId, commentId : Nat) : Text {
    postId.toText() # ":" # commentId.toText()
  };

  func getCloseFriendSet(uid : UserId) : Set.Set<UserId> {
    switch (closeFriends.get(uid)) {
      case (?s) s;
      case null Set.empty<UserId>();
    }
  };

  func isMutual(a : UserId, b : UserId) : Bool {
    getFollowSet(a).contains(b) and getFollowSet(b).contains(a)
  };

  func resolveProfiles(ids : [UserId]) : [UserProfile] {
    ids.filterMap(func(uid : UserId) : ?UserProfile { profiles.get(uid) })
  };

  // ─── Profiles ────────────────────────────────────────────────────────────────

  public shared (msg) func createProfile(username : Text, displayName : Text, bio : Text, avatarUrl : Text) : async { #ok; #err : Text } {
    let caller = msg.caller;
    if (username.size() == 0) return #err "Username required";
    if (displayName.size() == 0) return #err "Display name required";
    // Reject anonymous callers
    if (caller.isAnonymous()) return #err "Must be authenticated";
    // Case-insensitive username uniqueness
    let lowerUsername = username.toLower();
    switch (usernameIndex.get(lowerUsername)) {
      case (?existing) {
        // Allow caller to re-confirm their own profile (idempotent)
        if (existing == caller) return #ok;
        return #err "Username taken";
      };
      case null {};
    };
    // Also check original-case index for backward compat
    switch (usernameIndex.get(username)) {
      case (?existing) {
        if (existing != caller) return #err "Username taken";
      };
      case null {};
    };
    profiles.add(caller, {
      id = caller;
      username;
      displayName;
      bio;
      avatarUrl;
      createdAt = Time.now();
    });
    usernameIndex.add(lowerUsername, caller);
    usernameIndex.add(username, caller);
    #ok
  };

  public shared (msg) func updateProfile(displayName : Text, bio : Text, avatarUrl : Text) : async { #ok; #err : Text } {
    switch (profiles.get(msg.caller)) {
      case null { #err "Profile not found" };
      case (?e) {
        profiles.add(msg.caller, { e with displayName; bio; avatarUrl });
        #ok
      };
    }
  };

  public shared query (msg) func getMyProfile() : async ?UserProfile {
    profiles.get(msg.caller)
  };

  public query func getProfile(uid : UserId) : async ?UserProfile {
    profiles.get(uid)
  };

  public query func getProfileByUsername(username : Text) : async ?UserProfile {
    // Try exact match first, then case-insensitive
    switch (usernameIndex.get(username)) {
      case (?uid) profiles.get(uid);
      case null {
        switch (usernameIndex.get(username.toLower())) {
          case (?uid) profiles.get(uid);
          case null null;
        }
      };
    }
  };

  public query func getAllUsers() : async [UserProfile] {
    mapVals(profiles)
  };

  // ─── Posts ───────────────────────────────────────────────────────────────────

  public shared (msg) func createPost(imageUrl : Text, caption : Text, hashtags : [Text], songTitle : ?Text, songArtist : ?Text, isReel : Bool) : async { #ok : PostId; #err : Text } {
    if (imageUrl.size() == 0) return #err "Image required";
    let id = nextPostId;
    posts.add(id, {
      id;
      author = msg.caller;
      imageUrl;
      imageUrls = [imageUrl];
      caption;
      hashtags;
      songTitle;
      songArtist;
      isReel;
      createdAt = Time.now();
    });
    nextPostId += 1;
    trackHashtags(hashtags);
    #ok id
  };

  public shared (msg) func createCarouselPost(imageUrls : [Text], caption : Text, hashtags : [Text], songTitle : ?Text, songArtist : ?Text) : async { #ok : PostId; #err : Text } {
    if (imageUrls.size() == 0) return #err "At least one image required";
    let id = nextPostId;
    posts.add(id, {
      id;
      author = msg.caller;
      imageUrl = imageUrls[0];
      imageUrls;
      caption;
      hashtags;
      songTitle;
      songArtist;
      isReel = false;
      createdAt = Time.now();
    });
    nextPostId += 1;
    trackHashtags(hashtags);
    #ok id
  };

  public query func getPost(id : PostId) : async ?Post {
    posts.get(id)
  };

  public query func getPostImages(postId : PostId) : async [Text] {
    switch (posts.get(postId)) {
      case null [];
      case (?p) p.imageUrls;
    }
  };

  public query func getPostsByUser(uid : UserId) : async [Post] {
    mapVals(posts).filter(func(p : Post) : Bool { p.author == uid }).sort(postOrder)
  };

  // Caller-based: returns posts from users the caller follows + own posts, excludes blocked
  public shared query (msg) func getHomeFeed() : async [Post] {
    let caller = msg.caller;
    let myFollowing = getFollowSet(caller);
    let blocked = getBlockSet(caller);
    mapVals(posts).filter(func(p : Post) : Bool {
      if (blocked.contains(p.author)) return false;
      if (getBlockSet(p.author).contains(caller)) return false;
      p.author == caller or myFollowing.contains(p.author)
    }).sort(postOrder)
  };

  public query func getExploreFeed() : async [Post] {
    mapVals(posts).sort(postOrder)
  };

  public query func getReelsFeed(limit : Nat, offset : Nat) : async [Post] {
    let reels = mapVals(posts).filter(func(p : Post) : Bool { p.isReel }).sort(postOrder);
    let total = reels.size();
    if (offset >= total) return [];
    let end = if (offset + limit > total) total else offset + limit;
    reels.sliceToArray(offset, end)
  };

  // ─── Pinned Posts ─────────────────────────────────────────────────────────────

  public shared (msg) func pinPost(postId : PostId) : async { #ok; #err : Text } {
    let caller = msg.caller;
    switch (posts.get(postId)) {
      case null { #err "Post not found" };
      case (?p) {
        if (not Principal.equal(p.author, caller)) return #err "Not your post";
        let current = switch (pinnedPosts.get(caller)) {
          case (?arr) arr;
          case null [];
        };
        if (current.size() >= 3) return #err "Max 3 pinned posts";
        if (current.any(func(id : PostId) : Bool { id == postId })) return #ok;
        pinnedPosts.add(caller, current.concat([postId]));
        #ok
      };
    }
  };

  public shared (msg) func unpinPost(postId : PostId) : async { #ok; #err : Text } {
    let caller = msg.caller;
    let current = switch (pinnedPosts.get(caller)) {
      case (?arr) arr;
      case null [];
    };
    pinnedPosts.add(caller, current.filter(func(id : PostId) : Bool { id != postId }));
    #ok
  };

  public query func getPinnedPosts(uid : UserId) : async [Post] {
    let ids = switch (pinnedPosts.get(uid)) {
      case (?arr) arr;
      case null [];
    };
    ids.filterMap(func(id : PostId) : ?Post { posts.get(id) })
  };

  // ─── Stories ─────────────────────────────────────────────────────────────────

  public shared (msg) func createStory(imageUrl : Text, caption : Text, songTitle : ?Text, songArtist : ?Text) : async { #ok : StoryId; #err : Text } {
    if (imageUrl.size() == 0) return #err "Image required";
    let id = nextStoryId;
    stories.add(id, { id; author = msg.caller; imageUrl; caption; songTitle; songArtist; createdAt = Time.now() });
    nextStoryId += 1;
    #ok id
  };

  public query func getActiveStories() : async [StoryWithUser] {
    let cutoff = Time.now() - 86_400_000_000_000; // 24h
    mapVals(stories).filter(func(s : Story) : Bool {
      s.createdAt >= cutoff
    }).map<Story, StoryWithUser>(func(s : Story) : StoryWithUser {
      { story = s; authorProfile = profiles.get(s.author) }
    })
  };

  public shared (msg) func viewStory(storyId : StoryId) : async { #ok; #err : Text } {
    switch (stories.get(storyId)) {
      case null { #err "Story not found" };
      case (?_) {
        let s = switch (storyViews.get(storyId)) {
          case (?sv) sv;
          case null {
            let sv = Set.empty<UserId>();
            storyViews.add(storyId, sv);
            sv;
          };
        };
        s.add(msg.caller);
        #ok
      };
    }
  };

  // ─── Story Highlights ────────────────────────────────────────────────────────

  public shared (msg) func createHighlight(title : Text, coverUrl : Text) : async { #ok : HighlightId; #err : Text } {
    if (title.size() == 0) return #err "Title required";
    let id = nextHighlightId;
    let h : Highlight = {
      id;
      owner = msg.caller;
      title;
      coverUrl;
      storyIds = [];
      createdAt = Time.now();
    };
    highlights.add(id, h);
    let current = switch (userHighlights.get(msg.caller)) {
      case (?arr) arr;
      case null [];
    };
    userHighlights.add(msg.caller, current.concat([id]));
    nextHighlightId += 1;
    #ok id
  };

  public shared (msg) func updateHighlight(id : HighlightId, title : Text, coverUrl : Text) : async { #ok; #err : Text } {
    switch (highlights.get(id)) {
      case null { #err "Highlight not found" };
      case (?h) {
        if (not Principal.equal(h.owner, msg.caller)) return #err "Not your highlight";
        highlights.add(id, { h with title; coverUrl });
        #ok
      };
    }
  };

  public shared (msg) func deleteHighlight(id : HighlightId) : async { #ok; #err : Text } {
    switch (highlights.get(id)) {
      case null { #err "Highlight not found" };
      case (?h) {
        if (not Principal.equal(h.owner, msg.caller)) return #err "Not your highlight";
        highlights.remove(id);
        let current = switch (userHighlights.get(msg.caller)) {
          case (?arr) arr;
          case null [];
        };
        userHighlights.add(msg.caller, current.filter(func(hid : HighlightId) : Bool { hid != id }));
        #ok
      };
    }
  };

  public query func getHighlights(uid : UserId) : async [Highlight] {
    let ids = switch (userHighlights.get(uid)) {
      case (?arr) arr;
      case null [];
    };
    ids.filterMap(func(id : HighlightId) : ?Highlight { highlights.get(id) })
  };

  public shared (msg) func addStoryToHighlight(highlightId : HighlightId, storyId : StoryId) : async { #ok; #err : Text } {
    switch (highlights.get(highlightId)) {
      case null { #err "Highlight not found" };
      case (?h) {
        if (not Principal.equal(h.owner, msg.caller)) return #err "Not your highlight";
        if (h.storyIds.any(func(sid : StoryId) : Bool { sid == storyId })) return #ok;
        highlights.add(highlightId, { h with storyIds = h.storyIds.concat([storyId]) });
        #ok
      };
    }
  };

  public shared (msg) func removeStoryFromHighlight(highlightId : HighlightId, storyId : StoryId) : async { #ok; #err : Text } {
    switch (highlights.get(highlightId)) {
      case null { #err "Highlight not found" };
      case (?h) {
        if (not Principal.equal(h.owner, msg.caller)) return #err "Not your highlight";
        highlights.add(highlightId, { h with storyIds = h.storyIds.filter(func(sid : StoryId) : Bool { sid != storyId }) });
        #ok
      };
    }
  };

  // ─── Likes ───────────────────────────────────────────────────────────────────

  public shared (msg) func toggleLike(postId : PostId) : async { #ok : Bool; #err : Text } {
    switch (posts.get(postId)) {
      case null { #err "Post not found" };
      case (?p) {
        let caller = msg.caller;
        let s = switch (likes.get(postId)) {
          case (?ls) ls;
          case null {
            let ls = Set.empty<UserId>();
            likes.add(postId, ls);
            ls;
          };
        };
        if (s.contains(caller)) {
          s.remove(caller);
          #ok false
        } else {
          s.add(caller);
          pushNotif(p.author, caller, "like", ?postId);
          #ok true
        };
      };
    }
  };

  public query func getLikeCount(postId : PostId) : async Nat {
    switch (likes.get(postId)) {
      case (?s) s.size();
      case null 0;
    }
  };

  // Caller-based
  public shared query (msg) func isLiked(postId : PostId) : async Bool {
    switch (likes.get(postId)) {
      case (?s) s.contains(msg.caller);
      case null false;
    }
  };

  // ─── Comments ────────────────────────────────────────────────────────────────

  public shared (msg) func addComment(postId : PostId, text : Text) : async { #ok : CommentId; #err : Text } {
    switch (posts.get(postId)) {
      case null { #err "Post not found" };
      case (?p) {
        if (text.size() == 0) return #err "Comment cannot be empty";
        let id = nextCommentId;
        comments.add(id, { id; postId; author = msg.caller; text; createdAt = Time.now() });
        nextCommentId += 1;
        pushNotif(p.author, msg.caller, "comment", ?postId);
        #ok id
      };
    }
  };

  public query func getComments(postId : PostId) : async [Comment] {
    mapVals(comments).filter(func(c : Comment) : Bool { c.postId == postId }).sort(
      func(a : Comment, b : Comment) : { #less; #equal; #greater } {
        if (a.createdAt < b.createdAt) #less
        else if (a.createdAt > b.createdAt) #greater
        else #equal
      }
    )
  };

  // ─── Saves ───────────────────────────────────────────────────────────────────

  public shared (msg) func toggleSave(postId : PostId) : async { #ok : Bool; #err : Text } {
    switch (posts.get(postId)) {
      case null { #err "Post not found" };
      case (?_) {
        let caller = msg.caller;
        let s = switch (saves.get(caller)) {
          case (?ss) ss;
          case null {
            let ss = Set.empty<PostId>();
            saves.add(caller, ss);
            ss;
          };
        };
        if (s.contains(postId)) {
          s.remove(postId);
          #ok false
        } else {
          s.add(postId);
          #ok true
        };
      };
    }
  };

  // Caller-based
  public shared query (msg) func getSavedPosts() : async [Post] {
    switch (saves.get(msg.caller)) {
      case null [];
      case (?s) s.toArray().filterMap(func(pid : PostId) : ?Post { posts.get(pid) });
    }
  };

  // ─── Follows ─────────────────────────────────────────────────────────────────

  public shared (msg) func followUser(target : UserId) : async { #ok; #err : Text } {
    let caller = msg.caller;
    if (Principal.equal(caller, target)) return #err "Cannot follow yourself";
    let s = switch (follows.get(caller)) {
      case (?fs) fs;
      case null {
        let fs = Set.empty<UserId>();
        follows.add(caller, fs);
        fs;
      };
    };
    if (not s.contains(target)) {
      s.add(target);
      pushNotif(target, caller, "follow", null);
    };
    #ok
  };

  public shared (msg) func unfollowUser(target : UserId) : async { #ok; #err : Text } {
    switch (follows.get(msg.caller)) {
      case null {};
      case (?s) s.remove(target);
    };
    #ok
  };

  // Returns full profiles for followed users (excludes blocked)
  public query func getFollowing(uid : UserId) : async [UserProfile] {
    let blocked = getBlockSet(uid);
    resolveProfiles(getFollowSet(uid).toArray().filter(func(f : UserId) : Bool { not blocked.contains(f) }))
  };

  // Returns full profiles of followers (excludes blocked)
  public query func getFollowers(uid : UserId) : async [UserProfile] {
    let blocked = getBlockSet(uid);
    let followerIds = follows.toArray().filterMap(
      func((user, fs) : (UserId, Set.Set<UserId>)) : ?UserId {
        if (blocked.contains(user)) return null;
        if (fs.contains(uid)) ?user else null
      }
    );
    resolveProfiles(followerIds)
  };

  // Caller-based
  public shared query (msg) func isFollowing(target : UserId) : async Bool {
    getFollowSet(msg.caller).contains(target)
  };

  // ─── Close Friends ───────────────────────────────────────────────────────────

  public shared (msg) func addToCloseFriends(userId : UserId) : async { #ok; #err : Text } {
    let caller = msg.caller;
    if (Principal.equal(caller, userId)) return #err "Cannot add yourself";
    let s = switch (closeFriends.get(caller)) {
      case (?fs) fs;
      case null {
        let fs = Set.empty<UserId>();
        closeFriends.add(caller, fs);
        fs;
      };
    };
    s.add(userId);
    #ok
  };

  public shared (msg) func removeFromCloseFriends(userId : UserId) : async { #ok; #err : Text } {
    switch (closeFriends.get(msg.caller)) {
      case null {};
      case (?s) s.remove(userId);
    };
    #ok
  };

  public shared query (msg) func getCloseFriends() : async [UserProfile] {
    resolveProfiles(getCloseFriendSet(msg.caller).toArray())
  };

  public shared query (msg) func isCloseFriend(userId : UserId) : async Bool {
    getCloseFriendSet(msg.caller).contains(userId)
  };

  // ─── Notes ───────────────────────────────────────────────────────────────────

  public shared (msg) func createNote(content : Text, audience : NoteAudience) : async { #ok; #err : Text } {
    if (content.size() == 0) return #err "Note cannot be empty";
    if (content.size() > 60) return #err "Note too long (max 60 chars)";
    let now = Time.now();
    notes.add(msg.caller, {
      author = msg.caller;
      text = content;
      audience;
      createdAt = now;
      expiresAt = now + 86_400_000_000_000; // 24h
    });
    #ok
  };

  public shared (msg) func deleteNote() : async { #ok; #err : Text } {
    notes.remove(msg.caller);
    #ok
  };

  public shared query (msg) func getMyNote() : async ?Note {
    let now = Time.now();
    switch (notes.get(msg.caller)) {
      case null null;
      case (?n) if (n.expiresAt > now) ?n else null;
    }
  };

  public shared query (msg) func getFollowersNotes() : async [NoteWithAuthor] {
    let caller = msg.caller;
    let following = getFollowSet(caller);
    let now = Time.now();

    // Build set of principals who have caller in their close friends list
    let myCloseFriendOf = Set.empty<UserId>();
    for ((uid, cfSet) in closeFriends.entries()) {
      if (cfSet.contains(caller)) myCloseFriendOf.add(uid);
    };

    notes.values().toArray().filterMap(func(n : Note) : ?NoteWithAuthor {
      if (n.expiresAt <= now) return null;
      if (not following.contains(n.author)) return null;
      let allowed = switch (n.audience) {
        case (#MutualFollowers) isMutual(caller, n.author);
        case (#CloseFriends) myCloseFriendOf.contains(n.author);
      };
      if (not allowed) return null;
      let likeCount = switch (noteLikes.get(n.author)) {
        case (?s) s.size();
        case null 0;
      };
      ?{ note = n; authorProfile = profiles.get(n.author); likeCount }
    })
  };

  // likeNote / unlikeNote keyed by authorId (since one note per user)
  public shared (msg) func likeNote(authorId : UserId) : async { #ok; #err : Text } {
    switch (notes.get(authorId)) {
      case null { #err "Note not found" };
      case (?_) {
        let s = switch (noteLikes.get(authorId)) {
          case (?ls) ls;
          case null {
            let ls = Set.empty<UserId>();
            noteLikes.add(authorId, ls);
            ls;
          };
        };
        s.add(msg.caller);
        #ok
      };
    }
  };

  public shared (msg) func unlikeNote(authorId : UserId) : async { #ok; #err : Text } {
    switch (noteLikes.get(authorId)) {
      case null { #err "Note not found" };
      case (?s) {
        s.remove(msg.caller);
        #ok
      };
    }
  };

  public query func getNoteLikes(authorId : UserId) : async [Principal] {
    switch (noteLikes.get(authorId)) {
      case (?s) s.toArray();
      case null [];
    }
  };

  // replyToNote: sends a DM from caller to note author
  public shared (msg) func replyToNote(authorId : UserId, replyText : Text) : async { #ok : MessageId; #err : Text } {
    switch (notes.get(authorId)) {
      case null { #err "Note not found" };
      case (?_) {
        if (replyText.size() == 0) return #err "Reply cannot be empty";
        let id = nextMessageId;
        messages.add(id, {
          id;
          fromUser = msg.caller;
          toUser = authorId;
          text = replyText;
          sharedPostId = null;
          createdAt = Time.now();
        });
        nextMessageId += 1;
        #ok id
      };
    }
  };

  // ─── Messages ────────────────────────────────────────────────────────────────

  public shared (msg) func sendMessage(recipientId : UserId, content : Text, sharedPostId : ?PostId) : async { #ok : MessageId; #err : Text } {
    if (content.size() == 0 and sharedPostId == null) return #err "Message cannot be empty";
    let id = nextMessageId;
    messages.add(id, {
      id;
      fromUser = msg.caller;
      toUser = recipientId;
      text = content;
      sharedPostId;
      createdAt = Time.now();
    });
    nextMessageId += 1;
    #ok id
  };

  // Caller-based: get conversation with another user
  public shared query (msg) func getConversation(otherUserId : UserId) : async [Message] {
    let caller = msg.caller;
    mapVals(messages).filter(func(m : Message) : Bool {
      (m.fromUser == caller and m.toUser == otherUserId) or
      (m.fromUser == otherUserId and m.toUser == caller)
    }).sort(func(a : Message, b : Message) : { #less; #equal; #greater } {
      if (a.createdAt < b.createdAt) #less
      else if (a.createdAt > b.createdAt) #greater
      else #equal
    })
  };

  // Caller-based: get list of conversations with last message
  public shared query (msg) func getConversationList() : async [ConversationSummary] {
    let caller = msg.caller;
    let seen = Map.empty<UserId, Message>();
    // Find the latest message per conversation partner
    for (m in messages.values()) {
      let partner : UserId = if (m.fromUser == caller) m.toUser
        else if (m.toUser == caller) m.fromUser
        else continue;
      switch (seen.get(partner)) {
        case null { seen.add(partner, m) };
        case (?existing) {
          if (m.createdAt > existing.createdAt) seen.add(partner, m);
        };
      };
    };
    seen.entries().toArray().map<(UserId, Message), ConversationSummary>(
      func((uid, lastMsg) : (UserId, Message)) : ConversationSummary {
        { userId = uid; profile = profiles.get(uid); lastMessage = ?lastMsg }
      }
    )
  };

  // ─── Notifications ───────────────────────────────────────────────────────────

  // Caller-based
  public shared query (msg) func getNotifications() : async [Notification] {
    let caller = msg.caller;
    mapVals(notifications).filter(func(n : Notification) : Bool { n.toUser == caller }).sort(
      func(a : Notification, b : Notification) : { #less; #equal; #greater } {
        if (a.createdAt > b.createdAt) #less
        else if (a.createdAt < b.createdAt) #greater
        else #equal
      }
    )
  };

  public shared (msg) func markNotificationsRead() : async { #ok; #err : Text } {
    let caller = msg.caller;
    for ((id, n) in notifications.entries()) {
      if (n.toUser == caller and not n.isRead) {
        notifications.add(id, { n with isRead = true });
      };
    };
    #ok
  };

  // ─── Activity Status ─────────────────────────────────────────────────────────

  public shared (msg) func updateActivityStatus() : async { #ok; #err : Text } {
    activityStatus.add(msg.caller, Time.now());
    #ok
  };

  public query func getActivityStatus(userId : UserId) : async ActivityStatus {
    switch (activityStatus.get(userId)) {
      case null { { lastSeen = 0; isOnline = false } };
      case (?ts) {
        let isOnline = (Time.now() - ts) < onlineThreshold;
        { lastSeen = ts; isOnline };
      };
    }
  };

  public query func getActivityStatusBatch(userIds : [UserId]) : async [(UserId, ActivityStatus)] {
    let now = Time.now();
    userIds.map<UserId, (UserId, ActivityStatus)>(func(uid : UserId) : (UserId, ActivityStatus) {
      let status = switch (activityStatus.get(uid)) {
        case null { { lastSeen = 0; isOnline = false } };
        case (?ts) { { lastSeen = ts; isOnline = (now - ts) < onlineThreshold } };
      };
      (uid, status)
    })
  };

  // ─── Search ──────────────────────────────────────────────────────────────────

  public query func searchUsers(q : Text) : async [UserProfile] {
    let lq = q.toLower();
    mapVals(profiles).filter(func(p : UserProfile) : Bool {
      p.username.toLower().contains(#text lq) or p.displayName.toLower().contains(#text lq)
    })
  };

  public query func searchByHashtag(hashtag : Text) : async [Post] {
    let lq = hashtag.toLower();
    mapVals(posts).filter(func(p : Post) : Bool {
      p.hashtags.any(func(ht : Text) : Bool { ht.toLower() == lq })
    }).sort(postOrder)
  };

  // ─── Mute ─────────────────────────────────────────────────────────────────────

  public shared (msg) func muteUser(targetUserId : UserId) : async () {
    let caller = msg.caller;
    let s = switch (mutedUsers.get(caller)) {
      case (?ms) ms;
      case null {
        let ms = Set.empty<UserId>();
        mutedUsers.add(caller, ms);
        ms;
      };
    };
    s.add(targetUserId);
  };

  public shared (msg) func unmuteUser(targetUserId : UserId) : async () {
    switch (mutedUsers.get(msg.caller)) {
      case null {};
      case (?s) s.remove(targetUserId);
    };
  };

  public shared query (msg) func getMutedUsers() : async [UserId] {
    getMuteSet(msg.caller).toArray()
  };

  public shared query (msg) func isMuted(targetUserId : UserId) : async Bool {
    getMuteSet(msg.caller).contains(targetUserId)
  };

  // ─── Block ────────────────────────────────────────────────────────────────────

  public shared (msg) func blockUser(targetUserId : UserId) : async () {
    let caller = msg.caller;
    let s = switch (blockedUsers.get(caller)) {
      case (?bs) bs;
      case null {
        let bs = Set.empty<UserId>();
        blockedUsers.add(caller, bs);
        bs;
      };
    };
    s.add(targetUserId);
    // Auto-unfollow both directions on block
    switch (follows.get(caller)) { case (?fs) fs.remove(targetUserId); case null {} };
    switch (follows.get(targetUserId)) { case (?fs) fs.remove(caller); case null {} };
  };

  public shared (msg) func unblockUser(targetUserId : UserId) : async () {
    switch (blockedUsers.get(msg.caller)) {
      case null {};
      case (?s) s.remove(targetUserId);
    };
  };

  public shared query (msg) func getBlockedUsers() : async [UserId] {
    getBlockSet(msg.caller).toArray()
  };

  public shared query (msg) func isBlocked(targetUserId : UserId) : async Bool {
    getBlockSet(msg.caller).contains(targetUserId)
  };

  // ─── Trending Hashtags ────────────────────────────────────────────────────────

  public query func getTrendingHashtags(limit : Nat) : async [(Text, Nat)] {
    let all = hashtagCounts.toArray();
    let sorted = all.sort(func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
      if (a.1 > b.1) #less
      else if (a.1 < b.1) #greater
      else #equal
    });
    if (sorted.size() <= limit) sorted
    else sorted.sliceToArray(0, limit)
  };

  // ─── Comment Likes ────────────────────────────────────────────────────────────

  public shared (msg) func likeComment(postId : PostId, commentId : Nat) : async { #ok; #err : Text } {
    switch (comments.get(commentId)) {
      case null { #err "Comment not found" };
      case (?c) {
        if (c.postId != postId) return #err "Comment not on this post";
        let key = commentLikeKey(postId, commentId);
        let s = switch (commentLikes.get(key)) {
          case (?ls) ls;
          case null {
            let ls = Set.empty<UserId>();
            commentLikes.add(key, ls);
            ls;
          };
        };
        s.add(msg.caller);
        #ok
      };
    }
  };

  public shared (msg) func unlikeComment(postId : PostId, commentId : Nat) : async { #ok; #err : Text } {
    let key = commentLikeKey(postId, commentId);
    switch (commentLikes.get(key)) {
      case null { #err "No likes found" };
      case (?s) {
        s.remove(msg.caller);
        #ok
      };
    }
  };

  public query func getCommentLikes(postId : PostId, commentId : Nat) : async Nat {
    let key = commentLikeKey(postId, commentId);
    switch (commentLikes.get(key)) {
      case (?s) s.size();
      case null 0;
    }
  };

  public shared query (msg) func isCommentLiked(postId : PostId, commentId : Nat) : async Bool {
    let key = commentLikeKey(postId, commentId);
    switch (commentLikes.get(key)) {
      case (?s) s.contains(msg.caller);
      case null false;
    }
  };

  // ─── Emoji Reactions ──────────────────────────────────────────────────────────

  public shared (msg) func addReaction(postId : PostId, emoji : Text) : async { #ok; #err : Text } {
    switch (posts.get(postId)) {
      case null { #err "Post not found" };
      case (?_) {
        let caller = msg.caller;

        // Remove previous reaction if any
        let userMap = switch (userReactions.get(postId)) {
          case (?m) m;
          case null {
            let m = Map.empty<UserId, Text>();
            userReactions.add(postId, m);
            m;
          };
        };
        switch (userMap.get(caller)) {
          case (?prevEmoji) {
            // Decrement old emoji count
            let emojiMap = switch (reactions.get(postId)) {
              case (?m) m;
              case null Map.empty<Text, Set.Set<UserId>>();
            };
            switch (emojiMap.get(prevEmoji)) {
              case (?s) s.remove(caller);
              case null {};
            };
          };
          case null {};
        };

        // Add new reaction
        userMap.add(caller, emoji);
        let emojiMap = switch (reactions.get(postId)) {
          case (?m) m;
          case null {
            let m = Map.empty<Text, Set.Set<UserId>>();
            reactions.add(postId, m);
            m;
          };
        };
        let emojiSet = switch (emojiMap.get(emoji)) {
          case (?s) s;
          case null {
            let s = Set.empty<UserId>();
            emojiMap.add(emoji, s);
            s;
          };
        };
        emojiSet.add(caller);
        #ok
      };
    }
  };

  public shared (msg) func removeReaction(postId : PostId) : async { #ok; #err : Text } {
    let caller = msg.caller;
    switch (userReactions.get(postId)) {
      case null { #err "No reaction found" };
      case (?userMap) {
        switch (userMap.get(caller)) {
          case null { #err "No reaction found" };
          case (?prevEmoji) {
            userMap.remove(caller);
            switch (reactions.get(postId)) {
              case null {};
              case (?emojiMap) {
                switch (emojiMap.get(prevEmoji)) {
                case (?s) s.remove(caller);
                  case null {};
                };
              };
            };
            #ok
          };
        }
      };
    }
  };

  // ─── Password Authentication ──────────────────────────────────────────────────

  func isValidUsername(username : Text) : Bool {
    let size = username.size();
    if (size < 3 or size > 20) return false;
    username.toArray().all(func(c : Char) : Bool {
      (c >= 'a' and c <= 'z') or (c >= 'A' and c <= 'Z') or
      (c >= '0' and c <= '9') or c == '_'
    })
  };

  public shared (msg) func registerWithPassword(username : Text, passwordHash : Text) : async { #ok; #err : Text } {
    let key = username.toLower();
    if (not isValidUsername(username)) return #err "Username must be 3-20 chars, alphanumeric + underscore only";
    if (passwordHash.size() == 0) return #err "Password hash required";
    switch (passwordUsers.get(key)) {
      case (?existing) {
        // Allow same caller to update their password hash (re-register)
        if (existing.principalText == msg.caller.toText()) {
          passwordUsers.add(key, { passwordHash; principalText = existing.principalText });
          return #ok;
        };
        #err "Username already taken"
      };
      case null {
        let principalText = msg.caller.toText();
        passwordUsers.add(key, { passwordHash; principalText });
        #ok
      };
    }
  };

  public query func authenticateWithPassword(username : Text, passwordHash : Text) : async { #ok : Text; #err : Text } {
    let key = username.toLower();
    switch (passwordUsers.get(key)) {
      case null { #err "Invalid username or password" };
      case (?user) {
        if (user.passwordHash == passwordHash) {
          #ok (user.principalText)
        } else {
          #err "Invalid username or password"
        }
      };
    }
  };

  public query func getPasswordUserPrincipal(username : Text) : async ?Text {
    switch (passwordUsers.get(username.toLower())) {
      case null null;
      case (?user) ?user.principalText;
    }
  };

  public query func getReactions(postId : PostId) : async [(Text, Nat)] {
    switch (reactions.get(postId)) {
      case null [];
      case (?emojiMap) {
        let pairs = emojiMap.toArray().map<(Text, Set.Set<UserId>), (Text, Nat)>(
          func((emoji, s) : (Text, Set.Set<UserId>)) : (Text, Nat) { (emoji, s.size()) }
        );
        pairs.sort(func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
          if (a.1 > b.1) #less
          else if (a.1 < b.1) #greater
          else #equal
        })
      };
    }
  };

  // ─── Push Notification Tokens ─────────────────────────────────────────────────

  public shared (msg) func registerPushToken(token : Text) : async () {
    pushTokens.add(msg.caller, token);
  };

  public shared (msg) func unregisterPushToken() : async () {
    pushTokens.remove(msg.caller);
  };

  public shared query (msg) func getMyPushToken() : async ?Text {
    pushTokens.get(msg.caller)
  };

  // ─── Story Stickers — Polls ───────────────────────────────────────────────────

  public shared (msg) func createPoll(storyId : Text, question : Text, options : [Text]) : async { #ok : Text; #err : Text } {
    if (question.size() == 0) return #err "Question required";
    if (options.size() < 2) return #err "At least 2 options required";
    let pollId = "poll_" # nextPollId.toText();
    nextPollId += 1;
    polls.add(pollId, {
      id = pollId;
      storyId;
      question;
      options;
      createdBy = msg.caller;
      createdAt = Time.now();
    });
    pollVotes.add(pollId, Map.empty<UserId, Nat>());
    #ok pollId
  };

  public shared (msg) func votePoll(pollId : Text, optionIndex : Nat) : async { #ok; #err : Text } {
    switch (polls.get(pollId)) {
      case null { #err "Poll not found" };
      case (?p) {
        if (optionIndex >= p.options.size()) return #err "Invalid option";
        let voteMap = switch (pollVotes.get(pollId)) {
          case (?m) m;
          case null {
            let m = Map.empty<UserId, Nat>();
            pollVotes.add(pollId, m);
            m;
          };
        };
        voteMap.add(msg.caller, optionIndex);
        #ok
      };
    }
  };

  public shared query (msg) func getPollResults(pollId : Text) : async ?{ question : Text; options : [Text]; votes : [Nat]; userVote : ?Nat } {
    switch (polls.get(pollId)) {
      case null null;
      case (?p) {
        let voteMap = switch (pollVotes.get(pollId)) {
          case (?m) m;
          case null Map.empty<UserId, Nat>();
        };
        let size = p.options.size();
        let counts = Array.tabulate(size, func(i : Nat) : Nat {
          voteMap.values().foldLeft(0, func(acc : Nat, idx : Nat) : Nat {
            if (idx == i) acc + 1 else acc
          })
        });
        ?{
          question = p.question;
          options = p.options;
          votes = counts;
          userVote = voteMap.get(msg.caller);
        }
      };
    }
  };

  // ─── Story Stickers — Questions ───────────────────────────────────────────────

  // addQuestion is an alias for createQuestion to match frontend contract
  public shared (msg) func addQuestion(storyId : Text, questionText : Text) : async { #ok : Text; #err : Text } {
    if (questionText.size() == 0) return #err "Question required";
    let qId = "q_" # nextQuestionId.toText();
    nextQuestionId += 1;
    questions.add(qId, {
      id = qId;
      storyId;
      questionText;
      createdBy = msg.caller;
      createdAt = Time.now();
    });
    questionAnswers.add(qId, []);
    #ok qId
  };

  public shared (msg) func createQuestion(storyId : Text, questionText : Text) : async { #ok : Text; #err : Text } {
    if (questionText.size() == 0) return #err "Question required";
    let qId = "q_" # nextQuestionId.toText();
    nextQuestionId += 1;
    questions.add(qId, {
      id = qId;
      storyId;
      questionText;
      createdBy = msg.caller;
      createdAt = Time.now();
    });
    questionAnswers.add(qId, []);
    #ok qId
  };

  public shared (msg) func answerQuestion(questionId : Text, answer : Text) : async { #ok; #err : Text } {
    switch (questions.get(questionId)) {
      case null { #err "Question not found" };
      case (?_) {
        if (answer.size() == 0) return #err "Answer cannot be empty";
        let existing = switch (questionAnswers.get(questionId)) {
          case (?arr) arr;
          case null [];
        };
        let newAnswer : QuestionAnswer = {
          answerer = msg.caller.toText();
          answer;
          timestamp = Time.now();
        };
        questionAnswers.add(questionId, existing.concat([newAnswer]));
        #ok
      };
    }
  };

  public shared query (_msg) func getQuestionAnswers(questionId : Text) : async [{ answerer : Text; answer : Text; timestamp : Int }] {
    switch (questionAnswers.get(questionId)) {
      case null [];
      case (?arr) arr;
    }
  };

  // ─── File Upload / Download (client-side via StorageClient; these are no-ops) ──

  public shared (_msg) func uploadFile(_name : Text, _mime : Text, _data : Blob) : async { #ok : Text; #err : Text } {
    #err "Use StorageClient for file upload"
  };

  public query func downloadFile(_fileId : Text) : async { #ok : Blob; #err : Text } {
    #err "Use StorageClient for file download"
  };

  // ─── Setways (reserved / future) ─────────────────────────────────────────────

  public query func getAllSetways() : async [Text] {
    []
  };

  // ─── Story lookup by ID ───────────────────────────────────────────────────────

  public query func getStory(storyId : StoryId) : async ?Story {
    stories.get(storyId)
  };

  public query func getStories(uid : UserId) : async [Story] {
    let cutoff = Time.now() - 86_400_000_000_000;
    mapVals(stories).filter(func(s : Story) : Bool {
      s.author == uid and s.createdAt >= cutoff
    })
  };

  // ─── Device Management ────────────────────────────────────────────────────────

  public shared (msg) func registerDevice(deviceId : Text, deviceLabel : Text) : async Bool {
    if (deviceId.size() == 0) return false;
    let caller = msg.caller;
    let deviceMap = switch (userDevices.get(caller)) {
      case (?m) m;
      case null {
        let m = Map.empty<Text, DeviceInfo>();
        userDevices.add(caller, m);
        m;
      };
    };
    deviceMap.add(deviceId, {
      deviceId;
      deviceLabel;
      addedAt = Time.now();
      principalId = caller.toText();
    });
    true
  };

  public shared query (msg) func getMyDevices() : async [DeviceInfo] {
    switch (userDevices.get(msg.caller)) {
      case null [];
      case (?m) m.values().toArray();
    }
  };

  public shared (msg) func removeDevice(deviceId : Text) : async Bool {
    switch (userDevices.get(msg.caller)) {
      case null false;
      case (?m) {
        switch (m.get(deviceId)) {
          case null false;
          case (?_) {
            m.remove(deviceId);
            true
          };
        }
      };
    }
  };

  public shared query (msg) func isDeviceRegistered(deviceId : Text) : async Bool {
    switch (userDevices.get(msg.caller)) {
      case null false;
      case (?m) m.get(deviceId) != null;
    }
  };
};
