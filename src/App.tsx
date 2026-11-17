import { FormEvent, useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction, type TouchEvent } from 'react';
import {
  Activity,
  ArrowUpRight,
  BadgeAlert,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Footprints,
  History,
  House,
  Laptop,
  LockKeyhole,
  LogIn,
  Menu,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  Skull,
  Smartphone,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { TabbyLoader } from './TabbyLoader';
import { SparkyGuideAnimation, type SparkyGuideMode } from './SparkyGuideAnimation';

function SparqLogo({ className = '' }: { className?: string }) {
  return <img className={`sparq-logo ${className}`} src="/sparq-logo.jpg" alt="Sparq" />;
}

type Icon = typeof Activity;
type Action = {
  id?: string;
  title: string;
  detail: string;
  points: number;
  icon: Icon;
  kind: 'positive' | 'negative';
};
type Log = {
  id: string;
  player: string;
  userId: string;
  isOwn: boolean;
  avatarUrl?: string;
  action: string;
  points: number;
  time: string;
  icon: Icon;
  reaction?: 'respect' | 'proof' | 'rip';
  note?: string | null;
  proofUrl?: string;
  loggedAt?: string;
  comments: ActivityComment[];
  reactionCounts: Record<Reaction, number>;
};
type Reaction = 'respect' | 'proof' | 'rip';
type ActivityComment = {
  id: string;
  userId: string;
  author: string;
  body: string;
  createdAt: string;
};
type NotificationRecord = {
  id: string;
  actorUserId: string;
  type: 'ping' | 'log' | 'comment' | 'reaction';
  title: string;
  body: string;
  iconUrl?: string | null;
  activityId?: string | null;
  readAt?: string | null;
  createdAt: string;
};
type ActivityRow = {
  id: string;
  user_id: string;
  custom_title: string;
  icon: string;
  points: number;
  note?: string | null;
  proof_image_path?: string | null;
  opponent_reaction?: Log['reaction'] | null;
  logged_at: string;
};
type DrawerState = {
  action: Action;
  logId: string;
};
type Profile = {
  id: string;
  username: string;
  color_hex?: string;
  avatar_url?: string | null;
  avatarPath?: string | null;
  avatarUrl?: string;
};

const actions: Action[] = [
  { title: 'Sweat', detail: 'Run or workout', points: 30, icon: Footprints, kind: 'positive' },
  { title: 'Deep reading', detail: '15+ focused mins', points: 20, icon: BookOpen, kind: 'positive' },
  { title: 'Learn', detail: 'Build a real skill', points: 25, icon: Brain, kind: 'positive' },
  { title: 'Reset space', detail: 'Chores that count', points: 15, icon: House, kind: 'positive' },
  { title: 'Screen win', detail: 'Phone stayed down', points: 25, icon: Smartphone, kind: 'positive' },
  { title: 'Stillness', detail: 'Zero stimulation', points: 15, icon: TimerReset, kind: 'positive' },
  { title: 'Hard thing', detail: 'Choose discomfort', points: 20, icon: Zap, kind: 'positive' },
  { title: 'Doomscroll trap', detail: '30m+ disappeared', points: -20, icon: Smartphone, kind: 'negative' },
  { title: 'Bed rot', detail: 'Lost the morning', points: -15, icon: RotateCcw, kind: 'negative' },
  { title: 'Mindless eating', detail: 'Boredom won', points: -10, icon: BadgeAlert, kind: 'negative' },
  { title: 'Dodged priority', detail: 'Avoided the task', points: -20, icon: Laptop, kind: 'negative' },
];

const navItems = [
  { label: 'Sparq', icon: Trophy },
  { label: 'Shared feed', icon: History },
  { label: 'Zombie autopsy', icon: BarChart3 },
];

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [entryLoaderVisible, setEntryLoaderVisible] = useState(true);
  const [entryLoaderExiting, setEntryLoaderExiting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activeNav, setActiveNav] = useState('Sparq');
  const [logs, setLogs] = useState<Log[]>([]);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [connection, setConnection] = useState<'checking' | 'connected' | 'offline'>('checking');

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.error('Supabase connection check failed:', error);
          setConnection('offline');
        } else {
          setConnection('connected');
          setSession(data.session);
        }
      } catch (error: unknown) {
        if (!active) return;
        console.error('Supabase connection check failed:', error);
        setConnection('offline');
      } finally {
        if (active) setAuthReady(true);
      }
    };
    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setEntryLoaderVisible(true);
        setEntryLoaderExiting(false);
        setSession(nextSession);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const exitTimer = window.setTimeout(() => setEntryLoaderExiting(true), 1500);
    const hideTimer = window.setTimeout(() => setEntryLoaderVisible(false), 1950);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [authReady, session]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  };

  if (!authReady || entryLoaderVisible) {
    return <div className={`entry-loader-shell ${entryLoaderExiting ? 'is-exiting' : ''}`}><TabbyLoader /></div>;
  }

  if (!session) {
    return <AuthScreen error={authError} onError={setAuthError} />;
  }

  return (
    <ArenaApp
      session={session}
      profile={profile}
      setProfile={setProfile}
      profiles={profiles}
      setProfiles={setProfiles}
      connection={connection}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      logs={logs}
      setLogs={setLogs}
      drawer={drawer}
      setDrawer={setDrawer}
      toast={toast}
      setToast={setToast}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      onSignOut={handleSignOut}
    />
  );
}

function ArenaApp({
  session,
  profile,
  setProfile,
  profiles,
  setProfiles,
  connection,
  activeNav,
  setActiveNav,
  logs,
  setLogs,
  drawer,
  setDrawer,
  toast,
  setToast,
  menuOpen,
  setMenuOpen,
  onSignOut,
}: {
  session: Session;
  profile: Profile | null;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  profiles: Record<string, Profile>;
  setProfiles: Dispatch<SetStateAction<Record<string, Profile>>>;
  connection: 'checking' | 'connected' | 'offline';
  activeNav: string;
  setActiveNav: (nav: string) => void;
  logs: Log[];
  setLogs: Dispatch<SetStateAction<Log[]>>;
  drawer: DrawerState | null;
  setDrawer: (drawer: DrawerState | null) => void;
  toast: string;
  setToast: (message: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onSignOut: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [customActionOpen, setCustomActionOpen] = useState(false);
  const [availableActions, setAvailableActions] = useState<Action[]>(actions);
  const [logsLoading, setLogsLoading] = useState(true);
  const [stake, setStake] = useState('Loser buys Saturday coffee.');
  const [stakeId, setStakeId] = useState<string | null>(null);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [reactionPop, setReactionPop] = useState<{ reaction: Reaction; id: number } | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => {
      if (active) setPushEnabled(Boolean(subscription && Notification.permission === 'granted'));
    }).catch((error: unknown) => console.error('Push subscription status check failed:', error));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.from('profiles').select('id, username, color_hex, avatar_url').eq('id', session.user.id).single()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Profile load failed:', error);
          setToast(`Could not load profile: ${error.message}`);
          return;
        }
        let avatarUrl: string | undefined;
        if (data.avatar_url) {
          const { data: signedAvatar, error: avatarError } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 3600);
          if (avatarError) {
            console.error('Profile avatar preview failed:', avatarError);
          } else {
            avatarUrl = signedAvatar.signedUrl;
          }
        }
        const nextProfile = { ...data, avatarPath: data.avatar_url, avatarUrl };
        setProfile(nextProfile);
        setProfiles((current) => ({ ...current, [nextProfile.id]: nextProfile }));
      });

    return () => {
      active = false;
    };
  }, [refreshToken, session.user.id, setProfile, setToast]);

  useEffect(() => {
    let active = true;
    supabase.from('profiles').select('id, username, color_hex, avatar_url')
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Arena profiles load failed:', error);
          return;
        }
        const entries = await Promise.all((data ?? []).map(async (row) => {
          let avatarUrl: string | undefined;
          if (row.avatar_url) {
            const { data: signedAvatar, error: avatarError } = await supabase.storage.from('avatars').createSignedUrl(row.avatar_url, 3600);
            if (avatarError) console.error('Arena avatar preview failed:', avatarError);
            else avatarUrl = signedAvatar.signedUrl;
          }
          return [row.id, { ...row, avatarPath: row.avatar_url, avatarUrl }] as const;
        }));
        setProfiles(Object.fromEntries(entries));
      });
    return () => {
      active = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, actor_user_id, type, title, body, icon_url, activity_id, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!active) return;
      if (error) {
        console.error('Notification history load failed:', error);
        setToast(`Could not load notifications: ${error.message}`);
        return;
      }
      setNotifications((data ?? []).map((row) => ({
        id: row.id,
        actorUserId: row.actor_user_id,
        type: row.type as NotificationRecord['type'],
        title: row.title,
        body: row.body,
        iconUrl: row.icon_url,
        activityId: row.activity_id,
        readAt: row.read_at,
        createdAt: row.created_at,
      })));
    };
    loadNotifications();

    const channel = supabase.channel(`notifications-${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${session.user.id}`,
      }, (payload) => {
        const row = payload.new as {
          id: string;
          actor_user_id: string;
          type: string;
          title: string;
          body: string;
          icon_url?: string | null;
          activity_id?: string | null;
          read_at?: string | null;
          created_at: string;
        };
        setNotifications((current) => current.some((item) => item.id === row.id) ? current : [{
          id: row.id,
          actorUserId: row.actor_user_id,
          type: row.type as NotificationRecord['type'],
          title: row.title,
          body: row.body,
          iconUrl: row.icon_url,
          activityId: row.activity_id,
          readAt: row.read_at,
          createdAt: row.created_at,
        }, ...current]);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session.user.id, setToast]);

  useEffect(() => {
    let active = true;
    supabase.from('action_templates').select('id, title, icon, points, category').eq('is_archived', false).order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Action template load failed:', error);
          return;
        }
        const customActions = (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          detail: row.category === 'zombie' ? 'Your custom slip-up' : 'Your custom deliberate act',
          points: row.points,
          icon: iconForActivity(row.icon),
          kind: row.points < 0 ? 'negative' : 'positive',
        } satisfies Action));
        setAvailableActions((current) => [...actions, ...customActions.filter((candidate) => !actions.some((builtIn) => builtIn.title === candidate.title))]);
      });

    return () => {
      active = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let active = true;
    supabase.from('weekly_battles').select('id, stake_description').eq('is_active', true).order('week_start', { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Weekly stake load failed:', error);
          return;
        }
        if (data) {
          setStakeId(data.id);
          setStake(data.stake_description);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, user_id, custom_title, icon, points, note, proof_image_path, opponent_reaction, logged_at')
        .order('logged_at', { ascending: false })
        .limit(30);

      if (!active) return;
      if (error) {
        console.error('Activity log load failed:', error);
        setToast(`Could not load activity: ${error.message}`);
        setLogsLoading(false);
        return;
      }

      const activityIds = (data ?? []).map((row) => row.id);
      const { data: reactions, error: reactionError } = activityIds.length
        ? await supabase.from('activity_reactions').select('activity_id, reaction').in('activity_id', activityIds)
        : { data: [], error: null };
      if (reactionError) console.error('Activity reaction load failed:', reactionError);
      const reactionByActivity = new Map((reactions ?? []).map((reaction) => [reaction.activity_id, reaction.reaction as Reaction]));
      const reactionCountsByActivity = new Map<string, Record<Reaction, number>>();
      (reactions ?? []).forEach((reaction) => {
        const counts = reactionCountsByActivity.get(reaction.activity_id) ?? { respect: 0, proof: 0, rip: 0 };
        counts[reaction.reaction as Reaction] += 1;
        reactionCountsByActivity.set(reaction.activity_id, counts);
      });
      const { data: comments, error: commentsError } = activityIds.length
        ? await supabase.from('activity_comments').select('id, activity_id, user_id, body, created_at').in('activity_id', activityIds).order('created_at', { ascending: true })
        : { data: [], error: null };
      if (commentsError) {
        console.error('Activity comment load failed:', commentsError);
        setToast(`Could not load comments: ${commentsError.message}`);
      }
      const commentsByActivity = new Map<string, ActivityComment[]>();
      (comments ?? []).forEach((comment) => {
        const activityComments = commentsByActivity.get(comment.activity_id) ?? [];
        activityComments.push({
          id: comment.id,
          userId: comment.user_id,
          author: profiles[comment.user_id]?.username ?? (comment.user_id === session.user.id ? ownName : 'Partner'),
          body: comment.body,
          createdAt: comment.created_at,
        });
        commentsByActivity.set(comment.activity_id, activityComments);
      });
      const loadedLogs = await Promise.all((data ?? []).map(async (row) => {
        let proofUrl: string | undefined;
        if (row.proof_image_path) {
          const { data: signedProof, error: proofError } = await supabase.storage
            .from('proofs')
            .createSignedUrl(row.proof_image_path, 3600);
          if (proofError) {
            console.error('Proof preview link failed:', proofError);
          } else {
            proofUrl = signedProof.signedUrl;
          }
        }
        return {
          id: row.id,
          player: profiles[row.user_id]?.username ?? 'Loading…',
          userId: row.user_id,
          isOwn: row.user_id === session.user.id,
          avatarUrl: profiles[row.user_id]?.avatarUrl,
          action: row.custom_title,
          points: row.points,
          time: formatRelativeTime(row.logged_at),
          icon: iconForActivity(row.icon),
          note: row.note,
          proofUrl,
          reaction: reactionByActivity.get(row.id),
          loggedAt: row.logged_at,
          comments: commentsByActivity.get(row.id) ?? [],
          reactionCounts: reactionCountsByActivity.get(row.id) ?? { respect: 0, proof: 0, rip: 0 },
        } satisfies Log;
      }));
      setLogs(loadedLogs);
      setLogsLoading(false);
    };

    loadLogs();
    return () => {
      active = false;
    };
  }, [profiles, refreshToken, session.user.id, setLogs, setToast]);

  useEffect(() => {
    const channel = supabase
      .channel('arena-activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const row = payload.new as ActivityRow;
        if (row.user_id === session.user.id) return;
        setLogs((current) => {
          if (current.some((log) => log.id === row.id)) return current;
          return [{
            id: row.id,
            player: profiles[row.user_id]?.username ?? 'Loading…',
            userId: row.user_id,
            isOwn: false,
            avatarUrl: profiles[row.user_id]?.avatarUrl,
            action: row.custom_title,
            points: row.points,
            time: 'Just now',
            icon: iconForActivity(row.icon),
            note: row.note,
            reaction: row.opponent_reaction ?? undefined,
            loggedAt: row.logged_at,
            comments: [],
            reactionCounts: { respect: 0, proof: 0, rip: 0 },
          }, ...current];
        });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime activity subscription failed:', status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profiles, session.user.id, setLogs]);

  const reactToLog = async (logId: string, reaction: Reaction) => {
    const currentLog = logs.find((log) => log.id === logId);
    if (!currentLog || currentLog.isOwn) return;
    const isRemoving = currentLog.reaction === reaction;
    const updateReaction = (entries: Log[]) => entries.map((log) => {
      if (log.id !== logId) return log;
      const reactionCounts = { ...log.reactionCounts };
      if (isRemoving) {
        reactionCounts[reaction] = Math.max(0, reactionCounts[reaction] - 1);
      } else {
        if (log.reaction && log.reaction !== reaction) reactionCounts[log.reaction] = Math.max(0, reactionCounts[log.reaction] - 1);
        reactionCounts[reaction] += 1;
      }
      return { ...log, reaction: isRemoving ? undefined : reaction, reactionCounts };
    });
    setLogs(updateReaction);
    const result = isRemoving
      ? await supabase.from('activity_reactions').delete().eq('activity_id', logId).eq('user_id', session.user.id)
      : await supabase.from('activity_reactions').upsert({ activity_id: logId, user_id: session.user.id, reaction }, { onConflict: 'activity_id,user_id' });
    if (result.error) {
      console.error('Activity reaction update failed:', result.error);
      setToast(`Could not update reaction: ${result.error.message}`);
      setLogs((entries) => entries.map((log) => log.id === logId ? currentLog : log));
      return;
    }
    if (!isRemoving) {
      setReactionPop({ reaction, id: Date.now() });
      const reactionLabel = reaction === 'respect' ? 'Respect' : reaction === 'proof' ? 'Proof requested' : 'RIP';
      void sendPushNotification(currentLog.userId, 'reaction', `${ownName} reacted to your activity`, reactionLabel, logId, `/reaction-${reaction}.svg`);
    }
  };

  const commentOnLog = async (logId: string, body: string) => {
    const target = logs.find((log) => log.id === logId);
    if (!target || target.isOwn || !body.trim()) return;
    const { data, error } = await supabase.from('activity_comments')
      .insert({ activity_id: logId, user_id: session.user.id, body: body.trim() })
      .select('id, activity_id, user_id, body, created_at')
      .single();
    if (error) {
      console.error('Activity comment create failed:', error);
      setToast(`Could not add comment: ${error.message}`);
      return;
    }
    setLogs((current) => current.map((log) => log.id === logId
      ? { ...log, comments: [...log.comments, { id: data.id, userId: data.user_id, author: ownName, body: data.body, createdAt: data.created_at }] }
      : log));
    void sendPushNotification(target.userId, 'comment', `${ownName} commented on your activity`, data.body, logId, profile?.avatarUrl);
  };

  const scores = useMemo(() => {
    const you = logs.filter((log) => log.isOwn).reduce((total, log) => total + log.points, 0);
    const maya = logs.filter((log) => !log.isOwn).reduce((total, log) => total + log.points, 0);
    return { you, maya };
  }, [logs]);
  const lead = scores.you - scores.maya;
  const scoreTotal = Math.abs(scores.you) + Math.abs(scores.maya);
  const youWidth = scoreTotal === 0 ? '50%' : `${Math.round((Math.max(scores.you, 0) / scoreTotal) * 100)}%`;
  const ownName = profile?.username ?? session.user.email ?? 'You';
  const opponent = Object.values(profiles).find((candidate) => candidate.id !== session.user.id);
  const opponentName = opponent?.username ?? 'Opponent';
  const opponentQuietLabel = useMemo(() => {
    const latestOpponentLog = logs.filter((log) => !log.isOwn && log.loggedAt).sort((a, b) => new Date(b.loggedAt!).getTime() - new Date(a.loggedAt!).getTime())[0];
    return latestOpponentLog?.loggedAt ? `${formatQuietDuration(latestOpponentLog.loggedAt)} quiet` : 'No recent logs';
  }, [logs]);

  const sendPushNotification = async (recipientUserId: string | undefined, type: NotificationRecord['type'], title: string, body: string, activityId?: string, icon = '/sparq-logo.jpg') => {
    if (!recipientUserId || recipientUserId === session.user.id) return;
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        recipientUserId,
        type,
        title,
        body,
        activityId,
        icon,
        url: '/',
      },
    });
    if (error) {
      console.error('Push notification send failed:', error);
      setToast(`Could not send notification: ${error.message}`);
    }
  };

  const logAction = async (action: Action) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: session.user.id,
        custom_title: action.title,
        icon: action.title,
        points: action.points,
      })
      .select('id, user_id, custom_title, icon, points, logged_at')
      .single();

    if (error) {
      console.error('Activity log create failed:', error);
      setToast(`Could not save activity: ${error.message}`);
      return;
    }

    setLogs((current) => [{
      id: data.id,
      player: profile?.username ?? session.user.email ?? 'You',
      userId: session.user.id,
      isOwn: true,
      avatarUrl: profile?.avatarUrl,
      action: data.custom_title,
      points: data.points,
      time: 'Just now',
      icon: action.icon,
      comments: [],
      reactionCounts: { respect: 0, proof: 0, rip: 0 },
    }, ...current]);
    setDrawer({ action, logId: data.id });
    void sendPushNotification(opponent?.id, 'log', `${ownName} logged an activity`, `${action.title} · ${action.points > 0 ? '+' : ''}${action.points} XP`, data.id, profile?.avatarUrl);
  };

  const createCustomAction = async (title: string, points: number) => {
    const category = points < 0 ? 'zombie' : 'productivity';
    const { data, error } = await supabase.from('action_templates').insert({
      title,
      icon: 'Activity',
      points,
      category,
      created_by: session.user.id,
    }).select('id, title, icon, points, category').single();

    if (error) {
      console.error('Action template create failed:', error);
      setToast(`Could not create action: ${error.message}`);
      return;
    }

    const createdAction: Action = {
      id: data.id,
      title: data.title,
      detail: data.points < 0 ? 'Your custom slip-up' : 'Your custom deliberate act',
      points: data.points,
      icon: Activity,
      kind: data.points < 0 ? 'negative' : 'positive',
    };

    setAvailableActions((current) => [...current, createdAction]);
    setCustomActionOpen(false);
    setToast(`${title} added to Sparq`);
  };

  const enablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setToast('Push notifications are not supported here. Install the PWA over HTTPS.');
      return;
    }
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setToast('Push is not configured yet. Add VITE_VAPID_PUBLIC_KEY.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setToast('Notifications are blocked. Enable them in your phone settings.');
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription()
      ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: session.user.id,
      endpoint: subscription.endpoint,
      subscription: subscription.toJSON(),
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) {
      console.error('Push subscription save failed:', error);
      setToast(`Could not enable notifications: ${error.message}`);
      return;
    }
    setPushEnabled(true);
    setToast('Push notifications enabled');
    window.setTimeout(() => setToast(''), 2600);
  };

  const sendPing = async () => {
    if (!opponent?.id) {
      setToast('Your partner is not available yet.');
      return;
    }
    const { error } = await supabase.functions.invoke('send-push', {
      body: { recipientUserId: opponent.id, type: 'ping', title: `${profile?.username ?? 'Your partner'} sent a ping`, body: 'Wake up and check Sparq.', url: '/', icon: profile?.avatarUrl ?? '/sparq-logo.jpg' },
    });
    if (error) {
      console.error('Push ping failed:', error);
      setToast(`Could not send ping: ${error.message}`);
      return;
    }
    setToast(`Wake-up ping sent to ${opponentName}`);
    window.setTimeout(() => setToast(''), 2600);
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Notification read update failed:', error);
      setToast(`Could not update notification: ${error.message}`);
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((notification) => !notification.readAt).map((notification) => notification.id);
    if (unreadIds.length === 0) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => notification.readAt ? notification : { ...notification, readAt }));
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).in('id', unreadIds);
    if (error) {
      console.error('All notifications read update failed:', error);
      setToast(`Could not update notifications: ${error.message}`);
    }
  };

  const handlePullStart = (event: TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) pullStartY.current = event.touches[0].clientY;
  };
  const handlePullMove = (event: TouchEvent) => {
    if (pullStartY.current === null) return;
    const distance = event.touches[0].clientY - pullStartY.current;
    if (distance > 0) setPullDistance(Math.min(distance * 0.45, 80));
  };
  const handlePullEnd = () => {
    if (pullStartY.current === null) return;
    const shouldRefresh = pullDistance >= 52;
    pullStartY.current = null;
    setPullDistance(0);
    if (!shouldRefresh) return;
    setRefreshing(true);
    setRefreshToken((current) => current + 1);
    window.setTimeout(() => setRefreshing(false), 900);
  };

  const saveStake = async (description: string) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const dateValue = weekStart.toISOString().slice(0, 10);
    const query = stakeId
      ? supabase.from('weekly_battles').update({ stake_description: description }).eq('id', stakeId).select('id, stake_description').single()
      : supabase.from('weekly_battles').insert({ week_start: dateValue, stake_description: description, is_active: true }).select('id, stake_description').single();
    const { data, error } = await query;
    if (error) {
      console.error('Weekly stake save failed:', error);
      setToast(`Could not save stake: ${error.message}`);
      return;
    }
    setStakeId(data.id);
    setStake(data.stake_description);
    setStakeOpen(false);
  };

  return (
    <div className="app" onTouchStart={handlePullStart} onTouchMove={handlePullMove} onTouchEnd={handlePullEnd}>
      {(pullDistance > 0 || refreshing) && <div className="pull-refresh-indicator" style={{ transform: `translate(-50%, ${refreshing ? 16 : pullDistance - 28}px)` }}><span className="pull-refresh-spinner" />{refreshing ? 'Refreshing' : 'Pull to refresh'}</div>}
      <header className="mobile-header">
        <button className={`icon-btn menu-toggle ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <div className="wordmark"><SparqLogo /><span>SPARQ</span></div>
        <div className="notification-anchor">
          <button className="icon-btn notification-trigger" onClick={() => { setNotificationsOpen((open) => !open); setMenuOpen(false); }} aria-label="Open notifications" aria-expanded={notificationsOpen}><Bell size={18} />{notifications.some((notification) => !notification.readAt) && <span className="notification-dot" />}</button>
          {notificationsOpen && <NotificationMenu notifications={notifications} profiles={profiles} pushEnabled={pushEnabled} onEnablePush={enablePush} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onClose={() => setNotificationsOpen(false)} />}
        </div>
      </header>
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup"><div className="wordmark"><SparqLogo /><span>SPARQ</span></div><span className="brand-kicker">SPARQ SYSTEM</span></div>
        <div className="player-card"><div>{profile ? <strong>{profile.username}</strong> : <span className="skeleton skeleton-line profile-skeleton" />}<span>Active player</span></div><span className="online-dot" /></div>
        <nav className="nav">
          {navItems.map(({ label, icon: NavIcon }) => <button key={label} className={activeNav === label ? 'active' : ''} onClick={() => { setActiveNav(label); setMenuOpen(false); }}><NavIcon size={17} />{label}</button>)}
        </nav>
        <div className="sidebar-bottom"><button className="ping-link" onClick={sendPing}><Bell size={15} />Ping {opponentName} <span>{opponentQuietLabel}</span></button><button className="profile-link" onClick={() => setProfileOpen(true)}><div className="avatar you">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile?.username ?? session.user.email ?? 'P')}</div><span><strong>{profile?.username ?? 'Player'}</strong><small>Edit profile</small></span><Pencil size={15} /></button><button className="sign-out-link" onClick={onSignOut}>Sign out</button></div>
      </aside>

      <main className="main">
        <div className="topline"><div><span className="section-tag">Tuesday / Week 41</span><h1>{activeNav === 'Sparq' ? 'Stay awake.' : activeNav === 'Shared feed' ? 'Shared log.' : 'Know your patterns.'}</h1></div><div className="topline-actions"><span className={`live-badge ${connection}`}><span />{connection === 'connected' ? 'LIVE SYNC' : connection === 'offline' ? 'OFFLINE' : 'CONNECTING'}</span><button className="icon-btn" onClick={() => setGuideOpen(true)} aria-label="Open Sparq guide"><CircleHelp size={18} /></button><div className="avatar you">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile?.username ?? session.user.email ?? 'P')}</div></div></div>

        {activeNav === 'Sparq' && <ArenaView actions={availableActions} logs={logs} logsLoading={logsLoading} scores={scores} lead={lead} youWidth={youWidth} stake={stake} ownName={ownName} opponentName={opponentName} ownAvatarUrl={profile?.avatarUrl} opponentAvatarUrl={opponent?.avatarUrl} onLog={logAction} onOpenCustom={() => setCustomActionOpen(true)} onEditStake={() => setStakeOpen(true)} />}
        {activeNav === 'Shared feed' && <FeedView logs={logs} logsLoading={logsLoading} onReaction={reactToLog} onComment={commentOnLog} />}
        {activeNav === 'Zombie autopsy' && <StatsView logs={logs} scores={scores} />}
      </main>
      {drawer && <BottomDrawer action={drawer.action} logId={drawer.logId} session={session} onUpdated={(patch) => setLogs((current) => current.map((log) => log.id === drawer.logId ? { ...log, ...patch } : log))} onClose={() => setDrawer(null)} />}
      {profileOpen && profile && <ProfileModal profile={profile} session={session} onSaved={(nextProfile) => { setProfile(nextProfile); setProfiles((current) => ({ ...current, [nextProfile.id]: nextProfile })); setProfileOpen(false); }} onClose={() => setProfileOpen(false)} />}
      {customActionOpen && <CreateActionModal onCreate={createCustomAction} onClose={() => setCustomActionOpen(false)} />}
      {stakeOpen && <StakeModal initialValue={stake} onSave={saveStake} onClose={() => setStakeOpen(false)} />}
      {guideOpen && (activeNav === 'Shared feed' ? <ReactionGuideModal onClose={() => setGuideOpen(false)} /> : <GuideModal onClose={() => setGuideOpen(false)} />)}
      {reactionPop && <ReactionPopModal key={reactionPop.id} reaction={reactionPop.reaction} onClose={() => setReactionPop(null)} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function ReactionPopModal({ reaction, onClose }: { reaction: Reaction; onClose: () => void }) {
  const [frame, setFrame] = useState(0);
  const [cycle, setCycle] = useState(0);
  const details = {
    respect: { title: 'STRAIGHT FIRE!', subtitle: 'You hyped up your partner’s check-in with a blazing 16-bit pixel flame.' },
    proof: { title: 'RECEIPTS CHECKED!', subtitle: 'Stamped with the official 12-point Royal Sapphire & Gold Notary Seal.' },
    rip: { title: 'ABSOLUTELY COOKED', subtitle: 'Their legs have officially left the chat. Spirit wisp released.' },
  }[reaction];
  useEffect(() => {
    let cycleTimer = 0;
    let frameTimers: number[] = [];
    const runCycle = () => {
      frameTimers.forEach((timer) => window.clearTimeout(timer));
      frameTimers = [];
      setCycle((current) => current + 1);
      setFrame(0);
      if (reaction === 'respect') {
        frameTimers = [window.setTimeout(() => setFrame(1), 220), window.setTimeout(() => setFrame(2), 620)];
      } else if (reaction === 'proof') {
        frameTimers = [window.setTimeout(() => setFrame(1), 250)];
      }
      cycleTimer = window.setTimeout(runCycle, reaction === 'rip' ? 1600 : 1200);
    };
    runCycle();
    return () => {
      window.clearTimeout(cycleTimer);
      frameTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [reaction]);
  const iconSize = reaction === 'respect' ? (frame === 1 ? 96 : frame === 2 ? 88 : 56) : reaction === 'proof' ? (frame === 1 ? 92 : 68) : 90;
  const showShockwave = reaction !== 'proof' || frame === 1;
  return <div className={`reaction-pop-modal ${reaction}`} role="dialog" aria-label={details.title} onClick={onClose}><div className="reaction-pop-card" onClick={(event) => event.stopPropagation()}><button type="button" className="reaction-pop-close" onClick={onClose} aria-label="Close reaction animation"><X size={18} /></button><div className="reaction-pop-stage">{showShockwave && <span className="reaction-shockwave" />}{Array.from({ length: 8 }, (_, index) => <span className={`reaction-spark spark-${index + 1}`} key={index} />)}<div className="reaction-pop-hero" key={`${reaction}-${cycle}-${frame}`}><ReactionSequenceVisual reaction={reaction} frame={frame} size={iconSize} /></div></div><h3>{details.title}</h3><p>{details.subtitle}</p></div></div>;
}

function NotificationMenu({ notifications, profiles, pushEnabled, onEnablePush, onMarkRead, onMarkAllRead, onClose }: { notifications: NotificationRecord[]; profiles: Record<string, Profile>; pushEnabled: boolean; onEnablePush: () => void; onMarkRead: (id: string) => void; onMarkAllRead: () => void; onClose: () => void }) {
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  return <section className="notification-menu" role="dialog" aria-label="Notifications" onClick={(event) => event.stopPropagation()}>
    <div className="notification-menu-header"><div><span className="eyebrow">ACTIVITY CENTER</span><h2>Notifications{unreadCount > 0 && <span>{unreadCount}</span>}</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close notifications"><X size={17} /></button></div>
    <div className="notification-menu-actions"><button type="button" className={`notification-push-btn ${pushEnabled ? 'is-enabled' : ''}`} onClick={onEnablePush}><Bell size={14} />{pushEnabled ? 'Push enabled' : 'Enable push'}</button><button type="button" className="notification-read-btn" onClick={onMarkAllRead} disabled={unreadCount === 0}>Mark all read</button></div>
    <div className="notification-list">{notifications.length === 0 ? <p className="notification-empty">No updates yet. Your partner’s activity will appear here.</p> : notifications.map((notification) => {
      const reactionName = notification.body.toLowerCase().startsWith('proof') ? 'proof' : notification.body.toLowerCase() === 'rip' ? 'rip' : 'respect';
      const icon = notification.type === 'reaction' ? `/reaction-${reactionName}.svg` : profiles[notification.actorUserId]?.avatarUrl ?? '/sparq-logo.jpg';
      return <button type="button" className={`notification-item ${notification.readAt ? '' : 'is-unread'}`} key={notification.id} onClick={() => onMarkRead(notification.id)}><img className="notification-avatar" src={icon} alt="" /><span className="notification-copy"><strong>{notification.title}</strong><span>{notification.body}</span><small>{profiles[notification.actorUserId]?.username ?? 'Partner'} · {formatRelativeTime(notification.createdAt)}</small></span>{!notification.readAt && <i aria-label="Unread" />}</button>;
    })}</div>
  </section>;
}

const pixelReactionGrids: Record<Reaction, string[]> = {
  respect: ['.......K........', '......KRK.......', '.....KRRK.......', '.....KROK..K....', '....KRROOKKRK...', '...KRRROOORORK..', '..KRRROYYYOORK..', '..KRROYYYYYORK..', '.KRROYYWWYYYORK.', '.KRROYYWWYYYORK.', '.KRROYYYYYYYORK.', '.KRRROYYYYYOORK.', '..KRRROOOOOORK..', '...KRRRRRRRRK...', '....KKKKKKKK....', '................'],
  proof: ['......KKKK......', '....KKGGGGKK....', '..KKGGBBBBGGKK..', '.KGGBBBBBBBBGGK.', '.KGBBBWWWWBBBGK.', 'KGBBBBWWWWBBBBGK', 'KGBBBBWWWWBBBBGK', 'KGBBBBWWWWBBBBGK', 'KGBBBBWWWWBBBBGK', 'KGBBBBBBBBBBBBGK', 'KGBBBBWWWWBBBBGK', '.KGBBBWWWWBBBGK.', '.KGGBBBBBBBBGGK.', '..KKGGBBBBGGKK..', '....KKGGGGKK....', '......KKKK......'],
  rip: ['....KKKKKKKK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '.KWWWWWWWWWWWWK.', '.KWWWWWWWWWWWWK.', '.KWKKKKWWKKKKWK.', '.KWKAAKWWKAAKWK.', '.KWKKKKWWKKKKWK.', '.KWWWWWWWWWWWWK.', '..KWWWWKKWWWWK..', '..KSWWWWWWWWSK..', '...KSSWWWWSSK...', '....KWKWKWKWK...', '....KWKWKWKWK...', '.....KKKKKKK....', '................'],
};
const respectBurstGrid = ['..O....K....O...', '......KRK.......', '..K..KRRRK..K...', '.KRK.KROOK.KRK..', '.KROKRROOOKORK..', 'KRRROOYYYYOORRK.', 'KRROOYYYYYYOORK.', 'KRROYYWWWWYYORK.', 'KRROYYWWWWYYORK.', 'KRROYYYYYYYYORK.', 'KRRROYYYYYYOORK.', '.KRRROOOOOOORK..', '..KRRRRRRRRRK...', '...KKKKKKKKK....', '................', '................'];
const proofStarGrid = ['.......KK.......', '......KYYK......', '......KYYK......', '.....KYYYYK.....', '.KKKKYYYYYYKKKK.', 'KYYYYYYWWYYYYYYK', '.KYYYYWWWWYYYYK.', '..KYYYWWWWYYYK..', '...KYYYYYYYYK...', '..KYYYYKKYYYYK..', '..KYYYK..KYYYK..', '.KYYYK....KYYYK.', '.KKKK......KKKK.', '................', '................', '................'];
const ghostWispGrid = ['....KKKK....', '...KWWWWK...', '..KWWWWWWK..', '.KWWKWWKWWK.', '.KWWWWWWWWK.', '.KWWWWWWWWK.', '.KWWWWWWWWK.', '.KWWWWWWWWK.', '.KWKWWKWKWK.', '.K.K..K.K.K.', '............', '............'];

const pixelReactionPalettes: Record<Reaction, Record<string, string>> = {
  respect: { K: '#3B0A16', R: '#DC2626', O: '#F97316', Y: '#FACC15', W: '#FEF9C3' },
  proof: { K: '#172038', G: '#F59E0B', B: '#2563EB', W: '#FEF08A' },
  rip: { K: '#1E1B2E', W: '#F8FAFC', S: '#CBD5E1', A: '#FB923C' },
};

function PixelReactionIcon({ reaction, size = 16, animated = false, variant = 'default' }: { reaction: Reaction; size?: number; animated?: boolean; variant?: 'default' | 'burst' | 'star' | 'ghost' }) {
  if (animated && reaction === 'respect') {
    return <svg className="pixel-reaction-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"><path d="M7 2h2v2h1v1h1v1h1v2h1v3h1v3h-2v1H6v-1H4v-3H2v-2h1V7h1V5h1V4h1V3h1z" fill="#181418" opacity=".3" /><path className="respect-flame" d="M7 3h2v2h1v1h1v1h1v2h1v3H3v-3h1V7h1V6h1V5h1z" fill="#B85A66" /><path className="respect-flame" d="M7 5h2v2h1v2H9v3H5v-3h1V7h1z" fill="#FF7B3B" /><path className="respect-core" d="M7 8h2v3H7z" fill="#FFE869" /><rect x="7.5" y="9" width="1" height="1" fill="#fff" /></svg>;
  }
  if (animated && reaction === 'proof') {
    return <svg className="pixel-reaction-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"><g className="proof-seal"><path d="M5 1h6v2h2v2h2v2h-2v2h-2v2h-2v2H5v-2H3v-2H1V7h2V5h2V3h2z" fill="#8C5800" /><path d="M5 2h6v2h1v1h1v1h-1v1h-1v1h-1v1H6v-1H5V7H4V6H3V5h1V4h1z" fill="#FFC72C" /></g><circle cx="8" cy="8" r="4.5" fill="#2B4B8C" stroke="#183268" strokeWidth=".5" /><g className="proof-exclamation"><rect x="7.5" y="5" width="1" height="3" fill="#FFE869" /><rect x="7.5" y="6" width="1" height="1.5" fill="#fff" /><rect x="7.5" y="9.5" width="1" height="1" fill="#FFE869" /></g></svg>;
  }
  if (animated && reaction === 'rip') {
    return <svg className="pixel-reaction-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"><g className="rip-wisp"><rect x="11" y="2" width="2" height="1" fill="#B0C4DE" /><rect x="10" y="3" width="1" height="2" fill="#B0C4DE" /><rect x="13" y="3" width="1" height="2" fill="#B0C4DE" /><rect x="11.5" y="3.5" width="1" height="1" fill="#fff" /></g><g className="rip-skull"><path d="M5 3h6v1h1v4h-1v1h-1v1H9v1H7v-1H6v-1H5V9H4V4h1z" fill="#181418" /><path d="M5.5 3.5h5v4h-5z" fill="#F5F2EB" /><rect x="6.5" y="7.5" width="3" height="2" fill="#F5F2EB" /><rect x="6" y="9.5" width="4" height="2" fill="#DCD6CA" /><rect x="7" y="9.5" width=".5" height="1.5" fill="#181418" /><rect x="8.5" y="9.5" width=".5" height="1.5" fill="#181418" /><rect x="6" y="5" width="1.5" height="2" fill="#181418" /><rect x="8.5" y="5" width="1.5" height="2" fill="#181418" /><rect x="6.5" y="5.5" width=".5" height=".5" fill="#FF5555" /><rect x="9" y="5.5" width=".5" height=".5" fill="#FF5555" /><rect x="7.5" y="7" width="1" height="1" fill="#181418" /></g></svg>;
  }
  const grid = variant === 'burst' ? respectBurstGrid : variant === 'star' ? proofStarGrid : variant === 'ghost' ? ghostWispGrid : pixelReactionGrids[reaction];
  const palette = pixelReactionPalettes[reaction];
  const pixels = grid.flatMap((row, y) => Array.from(row).flatMap((character, x) => {
    const fill = palette[character];
    return fill ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />] : [];
  }));
  return <svg className="pixel-reaction-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">{pixels}</svg>;
}

function ReactionSequenceVisual({ reaction, frame, size }: { reaction: Reaction; frame: number; size: number }) {
  if (reaction === 'respect') {
    return <PixelReactionIcon reaction={reaction} size={size} variant={frame === 1 ? 'burst' : 'default'} />;
  }
  if (reaction === 'proof') {
    return <PixelReactionIcon reaction={reaction} size={size} variant={frame === 0 ? 'star' : 'default'} />;
  }
  return <div className="rip-sequence-visual"><PixelReactionIcon reaction={reaction} size={size} /><span className="rip-sequence-wisp"><PixelReactionIcon reaction="rip" size={size * .45} variant="ghost" /></span><b>RIP</b></div>;
}

function GuideModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const pages: { mode: SparkyGuideMode; eyebrow: string; title: string; copy: string }[] = [
    { mode: 'intro', eyebrow: 'MEET SPARKY', title: 'sup i am sparky', copy: 'Your tiny pixel-powered copilot for staying awake.' },
    { mode: 'log', eyebrow: '01 / LOG THE MOVE', title: 'Make the move visible.', copy: 'Tap a tile when you do something deliberate — or drift.' },
    { mode: 'breadcrumb', eyebrow: '02 / LEAVE A BREADCRUMB', title: 'Give future-you receipts.', copy: 'Add a note or proof when the moment needs a little context.' },
    { mode: 'awake', eyebrow: '03 / KEEP EACH OTHER AWAKE', title: 'Accountability, but make it kind.', copy: 'React to your partner’s logs, or send a gentle ping.' },
    { mode: 'win', eyebrow: '04 / WIN THE WEEK', title: 'Stack the good stuff.', copy: 'Build XP, protect the streak, and survive the stake.' },
  ];
  const current = pages[page];
  return <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label="How Sparq works" onClick={onClose}><section className="profile-modal guide-modal" onClick={(event) => event.stopPropagation()}><div className="profile-modal-header"><div><span className="eyebrow">{current.eyebrow}</span><h2>{current.title}</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close Sparq guide"><X size={18} /></button></div><div className={`guide-page ${page === 0 ? 'guide-page-intro' : ''}`} key={current.mode}><div className="guide-mascot"><SparkyGuideAnimation mode={current.mode} /></div><p className="guide-caption">{current.copy}</p></div><div className="guide-progress" aria-label={`Guide page ${page + 1} of ${pages.length}`}>{pages.map((item, index) => <button key={item.mode} className={index === page ? 'active' : ''} onClick={() => setPage(index)} aria-label={`Go to guide page ${index + 1}`} />)}</div><div className="guide-controls"><button className="outline-btn" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={page === 0}>Back</button><button className="auth-submit" onClick={() => page === pages.length - 1 ? onClose() : setPage((currentPage) => currentPage + 1)}>{page === pages.length - 1 ? 'Got it' : 'Next'}</button></div></section></div>;
}

function ReactionGuideAnimation({ reaction }: { reaction: Reaction }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setFrame((current) => (current + 1) % (reaction === 'rip' ? 2 : 3)), 650);
    return () => window.clearInterval(interval);
  }, [reaction]);
  return <div className="reaction-guide-visual"><SparkyGuideAnimation mode={reaction === 'respect' ? 'awake' : reaction === 'proof' ? 'win' : 'breadcrumb'} /><div className="reaction-guide-icon"><ReactionSequenceVisual reaction={reaction} frame={frame} size={112} /></div></div>;
}

function ReactionGuideModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const pages: { reaction: Reaction; eyebrow: string; title: string; copy: string }[] = [
    { reaction: 'respect', eyebrow: '01 / RESPECT', title: 'Celebrate the effort.', copy: 'Use Respect when your partner makes a deliberate move worth hyping up.' },
    { reaction: 'proof', eyebrow: '02 / PROOF', title: 'Ask for the receipts.', copy: 'Use Proof when you want a little evidence behind the check-in.' },
    { reaction: 'rip', eyebrow: '03 / RIP', title: 'Playfully call it out.', copy: 'Use RIP for a harmless, dramatic reaction when the zombie wins.' },
  ];
  const current = pages[page];
  return <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label="Shared log reactions" onClick={onClose}><section className="profile-modal guide-modal reaction-guide-modal" onClick={(event) => event.stopPropagation()}><div className="profile-modal-header"><div><span className="eyebrow">{current.eyebrow}</span><h2>{current.title}</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close reaction guide"><X size={18} /></button></div><div className="guide-page reaction-guide-page" key={current.reaction}><div className="guide-mascot"><ReactionGuideAnimation reaction={current.reaction} /></div><p className="guide-caption">{current.copy}</p></div><div className="guide-progress" aria-label={`Reaction page ${page + 1} of ${pages.length}`}>{pages.map((item, index) => <button key={item.reaction} className={index === page ? 'active' : ''} onClick={() => setPage(index)} aria-label={`Go to reaction page ${index + 1}`} />)}</div><div className="guide-controls"><button className="outline-btn" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={page === 0}>Back</button><button className="auth-submit" onClick={() => page === pages.length - 1 ? onClose() : setPage((currentPage) => currentPage + 1)}>{page === pages.length - 1 ? 'Got it' : 'Next'}</button></div></section></div>;
}

function initials(value: string): string {
  return value.trim().slice(0, 2).toUpperCase() || 'P';
}

function ProfileModal({ profile, session, onSaved, onClose }: { profile: Profile; session: Session; onSaved: (profile: Profile) => void; onClose: () => void }) {
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { data, error: updateError } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', session.user.id).select('id, username, color_hex, avatar_url').single();
    if (updateError) {
      setError(updateError.message);
    } else {
      onSaved({ ...profile, ...data, avatarPath: data.avatar_url, avatarUrl: profile.avatarUrl });
    }
    setSaving(false);
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile images must be under 5 MB.');
      return;
    }

    setAvatarBusy(true);
    setError('');
    setStatus('Uploading profile image…');
    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error('Profile avatar upload failed:', uploadError);
      setAvatarBusy(false);
      setError(uploadError.message);
      return;
    }

    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', session.user.id);
    if (updateError) {
      console.error('Profile avatar update failed:', updateError);
      await supabase.storage.from('avatars').remove([path]);
      setAvatarBusy(false);
      setError(updateError.message);
      return;
    }
    if (profile.avatarPath) await supabase.storage.from('avatars').remove([profile.avatarPath]);
    const { data: signedAvatar, error: signedError } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    setAvatarBusy(false);
    if (signedError) {
      console.error('Profile avatar preview failed:', signedError);
      setError(signedError.message);
      return;
    }
    onSaved({ ...profile, username, avatarPath: path, avatarUrl: signedAvatar.signedUrl });
    setStatus('Profile image updated');
  };

  return <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit profile" onClick={onClose}><form className="profile-modal" onSubmit={save} onClick={(event) => event.stopPropagation()}><div className="profile-modal-header"><div><span className="eyebrow">YOUR PROFILE</span><h2>Edit identity</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close profile editor"><X size={18} /></button></div><div className="profile-preview"><div className="avatar you">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(username || 'P')}</div><div><strong>{username || 'Your username'}</strong><span>Visible to your Sparq partner</span><button type="button" className="avatar-change" onClick={() => avatarInput.current?.click()} disabled={avatarBusy}>{avatarBusy ? 'Uploading…' : 'Edit profile picture'}</button><input ref={avatarInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} /></div></div><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} maxLength={24} required /></label>{status && <p className="profile-status">{status}</p>}{error && <p className="auth-error">{error}</p>}<button className="auth-submit" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></form></div>;
}

function iconForActivity(name: string): Icon {
  return actions.find((action) => action.title.toLowerCase() === name.toLowerCase())?.icon ?? Activity;
}

function formatRelativeTime(timestamp: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr ago`;
  return `${Math.floor(elapsedHours / 24)} day ago`;
}

function formatQuietDuration(timestamp: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Active';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;
  return `${Math.floor(elapsedHours / 24)}d`;
}

function CreateActionModal({ onCreate, onClose }: { onCreate: (title: string, points: number) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(15);
  const [kind, setKind] = useState<'positive' | 'negative'>('positive');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    await onCreate(title.trim(), kind === 'positive' ? Math.abs(points) : -Math.abs(points));
    setSaving(false);
  };

  return <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label="Create custom action" onClick={onClose}><form className="profile-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}><div className="profile-modal-header"><div><span className="eyebrow">CUSTOM TILE</span><h2>Add an action</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close custom action editor"><X size={18} /></button></div><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Phone-free morning" maxLength={32} required /></label><label>Type<select value={kind} onChange={(event) => setKind(event.target.value as 'positive' | 'negative')}><option value="positive">Deliberate act</option><option value="negative">Zombie slip-up</option></select></label><label>XP value<input type="number" min={1} max={100} value={points} onChange={(event) => setPoints(Number(event.target.value))} required /></label><button className="auth-submit" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add to Sparq'}</button></form></div>;
}

function StakeModal({ initialValue, onSave, onClose }: { initialValue: string; onSave: (value: string) => Promise<void>; onClose: () => void }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    await onSave(value.trim());
    setSaving(false);
  };
  return <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit weekly stake" onClick={onClose}><form className="profile-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}><div className="profile-modal-header"><div><span className="eyebrow">WEEKLY DUEL</span><h2>Set the stake</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close stake editor"><X size={18} /></button></div><label>What is on the line?<input value={value} onChange={(event) => setValue(event.target.value)} maxLength={80} required /></label><button className="auth-submit" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save stake'}</button></form></div>;
}

function AuthScreen({ error, onError }: { error: string; onError: (message: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    onError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) onError(signInError.message);
    setSubmitting(false);
  };

  return <div className="auth-shell"><div className="auth-card"><div className="auth-brand"><div className="wordmark">  <SparqLogo /><span>SPARQ</span></div><span className="brand-kicker">SPARQ SYSTEM</span></div><span className="eyebrow">PRIVATE TWO-PLAYER SPARQ</span><h1>Stay awake.</h1><p className="auth-intro">Sign in to enter your shared accountability space.</p><form onSubmit={submit}><label>Email<><span className="auth-input"><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span></></label><label>Password<><span className="auth-input"><LockKeyhole size={16} /><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></span></></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" type="submit" disabled={submitting}><LogIn size={16} />{submitting ? 'Entering…' : 'Enter Sparq'}</button></form><p className="auth-footnote">Access is limited to the two invited players.</p></div></div>;
}

function ArenaView({ actions, logs, logsLoading, scores, lead, youWidth, stake, ownName, opponentName, ownAvatarUrl, opponentAvatarUrl, onLog, onOpenCustom, onEditStake }: { actions: Action[]; logs: Log[]; logsLoading: boolean; scores: { you: number; maya: number }; lead: number; youWidth: string; stake: string; ownName: string; opponentName: string; ownAvatarUrl?: string; opponentAvatarUrl?: string; onLog: (action: Action) => void; onOpenCustom: () => void; onEditStake: () => void }) {
  const positives = actions.filter((action) => action.kind === 'positive');
  const negatives = actions.filter((action) => action.kind === 'negative');
  return <div className="arena-view">
    <section className="stake-banner"><div className="stake-copy"><span className="eyebrow">WEEKLY STAKE / ACTIVE</span><h2>{stake}</h2><p>Resets in <strong>4d 07h</strong> · Keep it clean.</p></div><div className="stake-actions"><button className="stake-edit" onClick={onEditStake}>Edit</button><div className="stake-badge"><Trophy size={18} /><span>WEEK 41</span></div></div></section>
    <section className="duel-card"><div className="duel-heading"><div><span className="eyebrow">THE WEEKLY DUEL</span><h2>Who is more awake?</h2></div><span className="duel-status"><span />{opponentName} IS ONLINE</span></div><div className="score-row"><div className="score-block"><span className="avatar you">{ownAvatarUrl ? <img src={ownAvatarUrl} alt="" /> : initials(ownName)}</span><div><span className="score-name">{ownName}</span><strong>{scores.you}<small> XP</small></strong></div></div><div className="score-center"><span>NET XP</span><strong>{lead >= 0 ? '+' : ''}{lead}</strong></div><div className="score-block right"><div><span className="score-name">{opponentName}</span><strong>{scores.maya}<small> XP</small></strong></div><span className="avatar maya">{opponentAvatarUrl ? <img src={opponentAvatarUrl} alt="" /> : initials(opponentName)}</span></div></div><div className="tug-track"><div className="tug-you" style={{ width: youWidth }} /></div><div className="tug-labels"><span>{ownName} <b>{scores.you}</b></span><span>{opponentName} <b>{scores.maya}</b></span></div></section>
    <div className="action-heading"><div><span className="eyebrow">TAP TO LOG</span><h2>Make a move</h2></div><span className="action-hint"><Sparkles size={14} /> 1 tap = instant log</span></div>
    <section className="action-section"><div className="action-label positive-label"><span className="label-line" />DELIBERATE ACTS <span className="xp-key">+ XP</span></div><div className="action-grid">{positives.map((action) => <ActionTile key={action.id ?? action.title} action={action} onClick={onLog} />)}<button className="action-tile custom-tile" onClick={onOpenCustom}><span className="custom-icon"><Plus size={22} /></span><strong>Custom log</strong><small>Make your own tile</small></button></div></section>
    <section className="action-section"><div className="action-label negative-label"><span className="label-line" />ZOMBIE SLIP-UPS <span className="xp-key">- XP</span></div><div className="action-grid negative-grid">{negatives.map((action) => <ActionTile key={action.id ?? action.title} action={action} onClick={onLog} />)}</div></section>
    <div className="below-grid"><section className="panel clean-day"><div className="panel-icon"><Shield size={19} /></div><div><span className="eyebrow">DAILY IGNITION</span><h3>Clean day shield</h3><p>Log 3 good actions with no slips to activate tomorrow.</p></div><div className="progress-ring"><strong>2/3</strong></div></section><section className="panel mini-feed"><div className="panel-title"><span className="eyebrow">RECENT MOVES</span><button>View feed <ArrowUpRight size={14} /></button></div>{logsLoading ? <MiniFeedSkeleton /> : logs.slice(0, 3).map((log) => <MiniLog key={log.id} log={log} />)}</section></div>
  </div>;
}

function MiniFeedSkeleton() {
  return <>{[1, 2, 3].map((item) => <div className="mini-log skeleton-log" key={item}><span className="skeleton skeleton-icon" /><div><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" /></div></div>)}</>;
}

function ActionTile({ action, onClick }: { action: Action; onClick: (action: Action) => void }) {
  const IconComponent = action.icon;
  return <button className={`action-tile ${action.kind}`} onClick={() => onClick(action)}><span className="tile-icon"><IconComponent size={21} /></span><strong>{action.title}</strong><small>{action.detail}</small><b>{action.points > 0 ? '+' : ''}{action.points} XP</b></button>;
}

function MiniLog({ log }: { log: Log }) {
  const LogIcon = log.icon;
  return <div className="mini-log"><span className={`mini-icon ${log.points > 0 ? 'positive' : 'negative'}`}><LogIcon size={14} /></span><div><strong>{log.player} · {log.action}</strong><small>{log.time}</small></div><b className={log.points > 0 ? 'gain' : 'loss'}>{log.points > 0 ? '+' : ''}{log.points}</b></div>;
}

function FeedView({ logs, logsLoading, onReaction, onComment }: { logs: Log[]; logsLoading: boolean; onReaction: (logId: string, reaction: Reaction) => void; onComment: (logId: string, body: string) => Promise<void> }) {
  return (
    <div className="subview">
      <section className="panel feed-panel">
        {logsLoading ? <FeedSkeleton /> : logs.length === 0 ? <p className="feed-empty">No activity yet. Make the first move from the Arena.</p> : logs.map((log) => {
          const LogIcon = log.icon;
          return <div className={`feed-row ${log.isOwn ? 'is-own' : 'is-opponent'}`} key={log.id}>
            <div className="feed-content">
              <div className="feed-card-header"><div className="feed-identity"><div className={`avatar ${log.isOwn ? 'you' : 'maya'}`}>{log.avatarUrl ? <img src={log.avatarUrl} alt="" /> : initials(log.player)}</div><span><strong>{log.player}</strong><small>{log.isOwn ? 'YOU' : 'PARTNER'} · {log.time}</small></span></div><b className="feed-xp-badge">{log.points > 0 ? '+' : ''}{log.points} XP</b></div>
              <div className="feed-card-copy"><h3 className={`feed-activity-title ${log.points > 0 ? 'gain' : 'loss'}`}><LogIcon size={16} />{log.action}</h3>{log.note && <p className="feed-note">{log.note}</p>}</div>
              {log.proofUrl && <img className="feed-proof" src={log.proofUrl} alt={`${log.action} proof`} />}
              <div className="feed-actions"><div className="reaction-row"><button disabled={log.isOwn} onClick={() => onReaction(log.id, 'respect')} className={`reaction-respect ${log.reaction === 'respect' ? 'selected' : ''}`} aria-label="Respect"><PixelReactionIcon reaction="respect" /><span>{log.reactionCounts.respect}</span></button><button disabled={log.isOwn} onClick={() => onReaction(log.id, 'proof')} className={`reaction-proof ${log.reaction === 'proof' ? 'selected' : ''}`} aria-label="Request proof"><PixelReactionIcon reaction="proof" /><span>{log.reactionCounts.proof}</span></button><button disabled={log.isOwn} onClick={() => onReaction(log.id, 'rip')} className={`reaction-rip ${log.reaction === 'rip' ? 'selected' : ''}`} aria-label="RIP"><PixelReactionIcon reaction="rip" /><span>{log.reactionCounts.rip}</span></button></div><span className="feed-comment-count">{log.comments.length} {log.comments.length === 1 ? 'comment' : 'comments'}</span></div>
              {log.comments.length > 0 && <div className="feed-comments">{log.comments.map((comment) => <div className="feed-comment" key={comment.id}><strong>{comment.author}</strong><span>{comment.body}</span><small>{formatRelativeTime(comment.createdAt)}</small></div>)}</div>}
              <CommentComposer onSubmit={(body) => onComment(log.id, body)} />
            </div>
          </div>;
        })}
      </section>
    </div>
  );
}

function CommentComposer({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    await onSubmit(value);
    setValue('');
    setBusy(false);
  };

  return <form className="comment-composer" onSubmit={submit}><input value={value} onChange={(event) => setValue(event.target.value)} maxLength={280} placeholder="Add a comment…" aria-label="Add a comment" /><button type="submit" disabled={busy || !value.trim()}>Send</button></form>;
}

function FeedSkeleton() {
  return <>{[1, 2, 3].map((item) => <div className="feed-skeleton" key={item}><span className="skeleton skeleton-avatar" /><div className="skeleton skeleton-bubble" /></div>)}</>;
}

function StatsView({ logs, scores }: { logs: Log[]; scores: { you: number; maya: number } }) {
  const positiveCounts = new Map<string, number>();
  const negativeCounts = new Map<string, number>();
  logs.forEach((log) => {
    const counts = log.points >= 0 ? positiveCounts : negativeCounts;
    counts.set(log.action, (counts.get(log.action) ?? 0) + 1);
  });
  const topHabit = [...positiveCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No data yet';
  const weakSpot = [...negativeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No slip-ups yet';
  const cleanDays = new Set(logs.filter((log) => log.points > 0 && log.loggedAt).map((log) => log.loggedAt?.slice(0, 10))).size;
  const compareTotal = Math.max(scores.you + scores.maya, 1);
  return <div className="subview"><div className="subview-heading"><div><span className="eyebrow">WEEKLY REPORT</span><h2>Know your patterns.</h2><p>No shame. Just useful evidence.</p></div><button className="outline-btn"><RotateCcw size={15} />This week</button></div><div className="stats-grid"><section className="panel stat-feature"><span className="eyebrow">NET XP COMPARISON</span><div className="big-compare"><div><strong>{scores.you}</strong><span>You</span></div><span>vs</span><div><strong>{scores.maya}</strong><span>Maya</span></div></div><div className="compare-bar"><span style={{ width: `${Math.max(0, Math.min(100, (scores.you / compareTotal) * 100))}%` }} /></div></section><section className="panel metric-card"><span className="metric-icon green"><Shield size={18} /></span><span className="eyebrow">CLEAN DAYS</span><strong>{cleanDays}</strong><p>Based on your logged activity</p></section><section className="panel metric-card"><span className="metric-icon amber"><Skull size={18} /></span><span className="eyebrow">ZOMBIE WEAKNESS</span><strong>{weakSpot}</strong><p>Most frequent slip-up</p></section><section className="panel heatmap-card"><span className="eyebrow">CONSISTENCY MAP</span><div className="heatmap">{Array.from({ length: 42 }, (_, index) => <i key={index} className={logs[index % Math.max(logs.length, 1)]?.points > 0 ? 'high' : index % 4 === 0 ? 'mid' : ''} />)}</div><div className="heatmap-label"><span>Less</span><span>More deliberate</span><strong>{topHabit}</strong></div></section></div></div>;
}

function BottomDrawer({ action, logId, session, onUpdated, onClose }: { action: Action; logId: string; session: Session; onUpdated: (patch: Pick<Log, 'note' | 'proofUrl'>) => void; onClose: () => void }) {
  const IconComponent = action.icon;
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const saveNote = async () => {
    setBusy(true);
    setStatus('');
    const { error } = await supabase.from('activity_logs').update({ note }).eq('id', logId).eq('user_id', session.user.id);
    setBusy(false);
    if (error) {
      console.error('Activity note update failed:', error);
      setStatus(`Could not save note: ${error.message}`);
      return;
    }
    setStatus('Note saved');
    onUpdated({ note });
    setNoteOpen(false);
  };

  const uploadProof = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('Proof images must be under 10 MB.');
      return;
    }

    setBusy(true);
    setStatus('Uploading proof…');
    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${session.user.id}/${logId}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('proofs').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      console.error('Proof upload failed:', uploadError);
      setBusy(false);
      setStatus(`Could not upload proof: ${uploadError.message}`);
      return;
    }

    const { error: updateError } = await supabase.from('activity_logs').update({ proof_image_path: path }).eq('id', logId).eq('user_id', session.user.id);
    if (updateError) {
      console.error('Proof path update failed:', updateError);
      await supabase.storage.from('proofs').remove([path]);
      setBusy(false);
      setStatus(`Could not attach proof: ${updateError.message}`);
      return;
    }

    setBusy(false);
    const { data: signedProof, error: signedProofError } = await supabase.storage.from('proofs').createSignedUrl(path, 3600);
    if (signedProofError) {
      console.error('Proof preview link failed:', signedProofError);
    } else {
      onUpdated({ proofUrl: signedProof.signedUrl });
    }
    setStatus('Proof attached');
  };

  return <div className="drawer"><div className={`drawer-icon ${action.kind}`}><IconComponent size={19} /></div><div className="drawer-copy"><strong>{action.title} logged <span className={action.kind === 'positive' ? 'gain' : 'loss'}>{action.points > 0 ? '+' : ''}{action.points} XP</span></strong><span>{status || 'Want to add context? Totally optional.'}</span></div>{noteOpen && <div className="drawer-note"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a quick note…" autoFocus /><button onClick={saveNote} disabled={busy}>{busy ? 'Saving…' : 'Save note'}</button></div>}<button className="drawer-action" onClick={() => setNoteOpen(true)} disabled={busy}><Laptop size={15} />Note</button><button className="drawer-action" onClick={() => fileInput.current?.click()} disabled={busy}><Users size={15} />Proof</button><input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProof} /><button className="drawer-close" onClick={onClose} aria-label="Dismiss"><X size={16} /></button></div>;
}

export default App;
