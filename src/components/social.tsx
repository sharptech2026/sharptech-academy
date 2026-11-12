import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { useProgress, useAuthSync } from "@/lib/progress";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import {
  getProfile,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getActivities,
  getLeaderboard,
  getNotifications,
  markNotificationRead,
  getSettings,
  updateSettings,
  getPublicProfile,
} from "@/routes/api/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Bell,
  Trophy,
  Users,
  Activity,
  Settings,
  Search,
  Mail,
  MapPin,
  Globe,
  Edit,
  ChevronDown,
  Loader2,
  Check,
  X,
  Star,
  Flame,
  Medal,
  Heart,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Code2,
  Dumbbell,
  BarChart3,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function SocialPage() {
  useAuthSync();
  const { user } = useCurrentUserState();
  const t = useTranslation("pt");
  const { name, streak, xp, isAuthenticated, theme, sound } = useProgress();

  const [activeTab, setActiveTab] = useState<"profile" | "friends" | "leaderboard" | "activity" | "notifications" | "settings">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", bio: "", location: "", website: "" });
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  // Load data
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setEditForm({
          displayName: data.displayName || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }, [isAuthenticated]);

  const loadFriends = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [friendsData, requestsData] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch (e) {
      console.error("Failed to load friends:", e);
    }
  }, [isAuthenticated]);

  const loadActivities = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getActivities({ data: { limit: 30 } });
      setActivities((data as any[]) || []);
    } catch (e) {
      console.error("Failed to load activities:", e);
    }
  }, [isAuthenticated]);

  const loadLeaderboard = useCallback(async (period: "weekly" | "monthly" | "all_time" = "weekly") => {
    if (!isAuthenticated) return;
    try {
      const data = await getLeaderboard({ data: { period, limit: 50 } });
      setLeaderboard((data?.entries as any[]) || []);
      setUserRank(data?.userRank ?? null);
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  }, [isAuthenticated]);

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadFriends();
      loadActivities();
      loadLeaderboard();
      loadNotifications();
      loadSettings();
    }
  }, [isAuthenticated, loadProfile, loadFriends, loadActivities, loadLeaderboard, loadNotifications, loadSettings]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchUsers({ data: { q: query, limit: 10 } });
      setSearchResults(results || []);
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      await sendFriendRequest({ data: { userId: targetId } });
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, requestSent: true } : u))
      );
      loadFriends();
    } catch (e: any) {
      alert(e.message || "Erro ao enviar pedido");
    }
  };

  const handleRespondRequest = async (friendshipId: string, action: "accept" | "decline") => {
    try {
      await respondFriendRequest({ data: { friendshipId, action } });
      loadFriends();
      loadNotifications();
    } catch (e: any) {
      alert(e.message || "Erro ao responder");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Tem a certeza que quer remover este amigo?")) return;
    try {
      await removeFriend({ data: { userId: friendId } });
      loadFriends();
    } catch (e: any) {
      alert(e.message || "Erro ao remover");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ data: editForm });
      loadProfile();
      setEditingProfile(false);
    } catch (e: any) {
      alert(e.message || "Erro ao guardar");
    }
  };

  const handleSettingsChange = async (key: string, value: any) => {
    try {
      await updateSettings({ data: { [key]: value } });
      setSettings((prev: any) => ({ ...prev, [key]: value }));
      // Update local progress store for theme/sound
      if (key === "theme") useProgress.getState().setTheme(value);
      if (key === "soundEnabled") useProgress.getState().toggleSound();
    } catch (e) {
      console.error("Settings update failed:", e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markNotificationRead({ data: { notificationId: id } });
      setNotifications((prev: any[]) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { n: diffMins });
    if (diffHours < 24) return t("hoursAgo", { n: diffHours });
    if (diffDays < 7) return t("daysAgo", { n: diffDays });
    return date.toLocaleDateString();
  };

  const getActivityText = (activity: any) => {
    const userName = activity.user?.displayName || activity.user?.name || "Alguém";
    switch (activity.type) {
      case "lesson_completed":
        return `${userName} ${t("userCompletedLesson", { name: userName, lesson: activity.payload?.lessonTitle || "uma lição" })}`;
      case "achievement_unlocked":
        return `${userName} ${t("userEarnedAchievement", { name: userName, achievement: activity.payload?.achievementName || "uma conquista" })}`;
      case "certificate_earned":
        return `${userName} ${t("userEarnedCertificate", { name: userName, course: activity.payload?.courseName || "um curso" })}`;
      case "challenge_completed":
        return `${userName} ${t("userCompletedChallenge", { name: userName })}`;
      case "streak_milestone":
        return `${userName} ${t("userReachedStreak", { name: userName, streak: activity.payload?.streak || 0 })}`;
      default:
        return `${userName} realizou uma atividade`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-5 h-5 text-primary" />;
      case "friend_accepted":
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case "achievement":
        return <Star className="w-5 h-5 text-amber-500" />;
      case "streak_reminder":
        return <Flame className="w-5 h-5 text-orange-500" />;
      case "daily_challenge":
        return <Medal className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <SignedIn>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Users className="w-16 h-16 mx-auto text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("profileTitle")}</h2>
            <p className="text-muted mb-6">{t("settingsTitle")}</p>
            <Button size="lg" onClick={() => window.location.href = "/login"}>
              {t("signIn")}
            </Button>
          </div>
        </div>
      </SignedIn>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t("profileTitle")}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? "default" : "secondary"} className="gap-1">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && unreadCount}
            </Badge>
          </div>
        </div>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "profile" | "friends" | "leaderboard" | "activity" | "notifications" | "settings")} className="border-t border-border w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-6 px-4 py-2 bg-background">
            <TabsTrigger value="profile" className="py-2 text-sm">{t("navProfile")}</TabsTrigger>
            <TabsTrigger value="friends" className="py-2 text-sm">{t("friends")}</TabsTrigger>
            <TabsTrigger value="leaderboard" className="py-2 text-sm">{t("leaderboard")}</TabsTrigger>
            <TabsTrigger value="activity" className="py-2 text-sm">{t("activityFeed")}</TabsTrigger>
            <TabsTrigger value="notifications" className="py-2 text-sm relative">
              {t("notifications") || "Notificações"}
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="py-2 text-sm">{t("navSettings")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-24 overflow-hidden">
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            editing={editingProfile}
            editForm={editForm}
            setEditForm={setEditForm}
            setEditing={setEditingProfile}
            onSave={handleSaveProfile}
            t={t}
            streak={streak}
            xp={xp}
            name={name}
            theme={theme}
          />
        )}

        {activeTab === "friends" && (
          <FriendsTab
            friends={friends}
            requests={requests}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            showSearchDialog={showSearchDialog}
            setShowSearchDialog={setShowSearchDialog}
            onSearch={handleSearch}
            onSendRequest={handleSendFriendRequest}
            onRespondRequest={handleRespondRequest}
            onRemoveFriend={handleRemoveFriend}
            t={t}
            loading={loading}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab
            leaderboard={leaderboard}
            userRank={userRank}
            t={t}
            xp={xp}
            streak={streak}
            name={name}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab activities={activities} getActivityText={getActivityText} formatTime={formatTime} t={t} />
        )}

        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            onMarkRead={handleMarkNotificationRead}
            getNotificationIcon={getNotificationIcon}
            formatTime={formatTime}
            t={t}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            onChange={handleSettingsChange}
            t={t}
            theme={theme}
            sound={sound}
          />
        )}
      </main>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({
  profile,
  editing,
  editForm,
  setEditForm,
  setEditing,
  onSave,
  t,
  streak,
  xp,
  name,
  theme,
}: any) {
  const avatarColors = [
    "bg-primary-soft",
    "bg-amber-bg",
    "bg-green-bg",
    "bg-purple-bg",
    "bg-pink-bg",
    "bg-blue-bg",
  ];
  const avatarColor = avatarColors[(profile?.userId?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <ScrollArea className="flex-1 space-y-4">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className={`relative w-24 h-24 rounded-2xl ${avatarColor} flex items-center justify-center flex-shrink-0`}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">{(profile?.displayName || name || "?")[0].toUpperCase()}</span>
            )}
            {editing && (
              <Button variant="ghost" size="icon" className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                placeholder={t("yourName")}
                className="text-2xl font-bold bg-transparent border-0 focus:ring-0"
              />
            ) : (
              <h2 className="text-2xl font-bold truncate">{profile?.displayName || name || t("yourName")}</h2>
            )}
            <p className="text-muted text-sm">{profile?.email || ""}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4" />
                {xp} XP
              </span>
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                {streak} {t("streak")}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Medal className="w-4 h-4" />
                Nível {Math.floor(xp / 100) + 1}
              </span>
            </div>
          </div>
        </div>

        {profile?.bio && !editing && (
          <p className="mt-4 text-muted leading-relaxed">{profile.bio}</p>
        )}

        {(profile?.location || profile?.website) && !editing && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Globe className="w-4 h-4" />
                {profile.website}
              </a>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {editing ? (
            <>
              <Button onClick={onSave} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {t("save")}
              </Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setEditForm({ displayName: profile?.displayName || "", bio: profile?.bio || "", location: profile?.location || "", website: profile?.website || "" }); }}>
                <X className="w-4 h-4 mr-2" />
                {t("cancel")}
              </Button>
            </>
          ) : (
            <Button variant="surface" onClick={() => setEditing(true)} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              {t("editProfile")}
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("bio")}</label>
            <Textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Conta um pouco sobre ti..."
              rows={3}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("location")}</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder={t("location")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("website")}</label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://exemplo.pt"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Star />} value={xp} label={t("totalXP")} color="text-amber-500" />
        <StatCard icon={<Flame />} value={streak} label={t("currentStreak")} color="text-orange-500" />
        <StatCard icon={<Trophy />} value={profile?.bestStreak || 0} label={t("bestStreak")} color="text-yellow-500" />
        <StatCard icon={<Users />} value={profile?.friendsCount || 0} label={t("friends")} color="text-primary" />
      </div>

      {/* Achievements Preview */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Medal className="w-5 h-5" />
          Conquistas Recentes
        </h3>
        <p className="text-muted text-sm text-center py-4">As tuas conquistas aparecem aqui quando as desbloqueares!</p>
      </div>
    </ScrollArea>
  );
}

function StatCard({ icon: Icon, value, label, color }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

// Friends Tab Component
function FriendsTab({
  friends,
  requests,
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchDialog,
  setShowSearchDialog,
  onSearch,
  onSendRequest,
  onRespondRequest,
  onRemoveFriend,
  t,
  loading,
}: any) {
  return (
    <ScrollArea className="flex-1 space-y-4">
      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t("friendRequests")} ({requests.length})
          </h3>
          {requests.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.user?.avatarUrl} />
                  <AvatarFallback>{req.user?.displayName?.[0] || req.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{req.user?.displayName || req.user?.name}</p>
                  <p className="text-sm text-muted">{t("friendRequestSent")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="surface" size="md" onClick={() => onRespondRequest(req.id, "decline")}>
                  <X className="w-4 h-4 mr-1" />
                  {t("declineRequest")}
                </Button>
                <Button size="md" onClick={() => onRespondRequest(req.id, "accept")}>
                  <Check className="w-4 h-4 mr-1" />
                  {t("acceptRequest")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("friends")} ({friends.length})
          </h3>
          <Button variant="surface" size="md" onClick={() => setShowSearchDialog(true)}>
            <UserPlus className="w-4 h-4 mr-1" />
            {t("addFriend")}
          </Button>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t("noFriends")}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {friends.map((friend: any) => (
              <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-background rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>{friend.displayName?.[0] || friend.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{friend.displayName || friend.name}</p>
                    <p className="text-sm text-muted">{friend.xp} XP · {friend.streak} {t("streak")}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemoveFriend(friend.id)}>
                  <UserMinus className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addFriend")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
                className="pl-10"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.displayName?.[0] || user.name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName || user.name}</p>
                        <p className="text-sm text-muted">{user.xp} XP · Nível {Math.floor(user.xp / 100) + 1}</p>
                      </div>
                    </div>
                    {user.requestSent ? (
                      <Badge variant="secondary">{t("friendRequestSent")}</Badge>
                    ) : (
                      <Button size="md" onClick={() => onSendRequest(user.id)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        {t("addFriend")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && !loading && (
              <p className="text-center text-muted py-4">{t("noUsersFound")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

// Leaderboard Tab Component
function LeaderboardTab({ leaderboard, userRank, t, xp, streak, name }: any) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("weekly");

  return (
    <ScrollArea className="flex-1 space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(["weekly", "monthly", "all_time"] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? "primary" : "surface"}
            size="md"
            onClick={() => setPeriod(p)}
          >
            {t(p === "weekly" ? "weeklyLeaderboard" : p === "monthly" ? "monthlyLeaderboard" : "globalLeaderboard")}
          </Button>
        ))}
      </div>

      {/* User Rank Card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{(name || "?")[0].toUpperCase()}</span>
            {userRank && (
              <span className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                #{userRank}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted">{t("yourRank", { rank: userRank || "?" })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-500">{xp} XP</p>
            <p className="text-sm text-muted">{streak} {t("streak")}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-muted font-medium border-b border-border">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Jogador</div>
          <div className="col-span-3 text-center">XP</div>
          <div className="col-span-3 text-center">Sequência</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted py-8">{t("noLeaderboardData")}</p>
          ) : (
            leaderboard.map((entry: any, idx: number) => (
              <div
                key={entry.userId}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-border/50 hover:bg-background transition-colors ${entry.userId === "current" ? "bg-primary-soft/50" : ""}`}
              >
                <div className="col-span-1 text-center font-bold text-lg">
                  {idx + 1}
                  {idx === 0 && <Medal className="w-5 h-5 text-amber-500 mx-auto -mt-1" />}
                  {idx === 1 && <Medal className="w-5 h-5 text-gray-400 mx-auto -mt-1" />}
                  {idx === 2 && <Medal className="w-5 h-5 text-amber-700 mx-auto -mt-1" />}
                </div>
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={entry.user?.avatarUrl} />
                    <AvatarFallback>{entry.user?.displayName?.[0] || entry.user?.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.user?.displayName || entry.user?.name}</p>
                    <p className="text-xs text-muted">Nível {Math.floor((entry.user?.xp || 0) / 100) + 1}</p>
                  </div>
                </div>
                <div className="col-span-3 text-center text-amber-500 font-medium">{entry.xp} XP</div>
                <div className="col-span-3 text-center text-orange-500 font-medium">
                  <Flame className="w-4 h-4 inline mr-1" />
                  {entry.user?.streak || 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// Activity Tab Component
function ActivityTab({ activities, getActivityText, formatTime, t }: any) {
  return (
    <ScrollArea className="flex-1">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma atividade recente</p>
          <p className="text-sm mt-1">Quando tu e os teus amigos fizerem progresso, vai aparecer aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity: any) => (
            <div key={activity.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{getActivityText(activity)}</p>
                <p className="text-xs text-muted mt-1">{formatTime(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

// Notifications Tab Component
function NotificationsTab({ notifications, onMarkRead, getNotificationIcon, formatTime, t }: any) {
  return (
    <ScrollArea className="flex-1">
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Sem notificações</p>
          <p className="text-sm mt-1">Vão aparecer aqui quando receberes pedidos de amizade, conquistas, etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`bg-card border border-border rounded-xl p-4 flex gap-3 ${!notif.read ? "bg-primary-soft/20 border-primary" : ""}`}
              onClick={() => !notif.read && onMarkRead(notif.id)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{notif.title}</p>
                {notif.message && <p className="text-sm text-muted mt-1">{notif.message}</p>}
                <p className="text-xs text-muted mt-1">{formatTime(notif.createdAt)}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-6 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

// Settings Tab Component
function SettingsTab({ settings, onChange, t, theme, sound }: any) {
  return (
    <ScrollArea className="flex-1 space-y-6">
      {/* Appearance */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t("theme")} / {t("language")}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("theme")}</label>
            <Select value={settings?.theme || theme} onValueChange={(v) => onChange("theme", v)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">{t("themeLight")}</SelectItem>
                <SelectItem value="noite">{t("themeDark")}</SelectItem>
                <SelectItem value="papel">{t("themePaper")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("language")}</label>
            <Select value={settings?.language || "pt"} onValueChange={(v) => onChange("language", v)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">🇵🇹 Português</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Sounds & Notifications */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t("sound")} & {t("notifications")}
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="font-medium">{t("sound")}</span>
            <input
              type="checkbox"
              checked={settings?.soundEnabled ?? sound}
              onChange={(e) => onChange("soundEnabled", e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="font-medium">{t("dailyReminder")}</span>
            <input
              type="checkbox"
              checked={settings?.dailyReminderEnabled ?? false}
              onChange={(e) => onChange("dailyReminderEnabled", e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          {(settings?.dailyReminderEnabled ?? false) && (
            <div className="pl-6">
              <label className="block text-sm font-medium mb-1">{t("reminderTime")}</label>
              <Input
                type="time"
                value={settings?.dailyReminderTime || "19:00"}
                onChange={(e) => onChange("dailyReminderTime", e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
          )}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          {t("account")} & Privacidade
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t("publicProfile") || "Perfil público"}</span>
              <p className="text-xs text-muted">Outros utilizadores podem ver o teu perfil</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.publicProfile ?? true}
              onChange={(e) => onChange("publicProfile", e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t("showOnLeaderboard") || "Aparecer no ranking"}</span>
              <p className="text-xs text-muted">O teu nome aparece nas classificações</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.showOnLeaderboard ?? true}
              onChange={(e) => onChange("showOnLeaderboard", e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-4 border-bad/20">
        <h3 className="font-semibold flex items-center gap-2 text-bad">
          <LogOut className="w-5 h-5" />
          Zona de Perigo
        </h3>

        <Button variant="deep" className="w-full" onClick={() => {
          if (confirm("Tem a certeza? Esta ação não pode ser desfeita.")) {
            window.location.href = "/login"; // Sign out
          }
        }}>
          <LogOut className="w-4 h-4 mr-2" />
          {t("signOut")}
        </Button>

        <p className="text-xs text-muted text-center">{t("deleteAccountConfirm")}</p>
      </section>
    </ScrollArea>
  );
}

export default SocialPage;