import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type NotificationKind = "message" | "like";

interface Notification {
  key: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  createdAt: string;
  href: string;
  unread: boolean;
}

const NotificationsBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  // Load + subscribe to messages
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setNotifications(null);
      return;
    }

    const loadAll = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnreadMessages(count ?? 0);

      // Recent messages (5)
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, body, is_read, created_at, deleted_for_everyone")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const senderIds = Array.from(new Set((msgs ?? []).map((m) => m.sender_id)));
      let senderMap: Record<string, { full_name: string | null; username: string | null }> = {};
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from("profiles")
          .select("user_id, full_name, username")
          .in("user_id", senderIds);
        senderMap = Object.fromEntries(
          (senders ?? []).map((s) => [s.user_id, { full_name: s.full_name, username: s.username }]),
        );
      }

      // Recent likes on user's portfolios (5)
      const { data: myPortfolios } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id);
      const portfolioIds = (myPortfolios ?? []).map((p) => p.id);

      let likeNotifs: Notification[] = [];
      if (portfolioIds.length > 0) {
        const { data: likes } = await supabase
          .from("likes")
          .select("id, user_id, created_at")
          .in("portfolio_id", portfolioIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const likerIds = Array.from(new Set((likes ?? []).map((l) => l.user_id)));
        let likerMap: Record<string, { full_name: string | null; username: string | null }> = {};
        if (likerIds.length > 0) {
          const { data: likers } = await supabase
            .from("profiles")
            .select("user_id, full_name, username")
            .in("user_id", likerIds);
          likerMap = Object.fromEntries(
            (likers ?? []).map((s) => [s.user_id, { full_name: s.full_name, username: s.username }]),
          );
        }

        likeNotifs = (likes ?? []).map((l) => {
          const liker = likerMap[l.user_id];
          const name = liker?.full_name || liker?.username || "Someone";
          return {
            key: `like-${l.id}`,
            kind: "like" as const,
            title: `${name} liked your portfolio`,
            subtitle: "Tap to view your portfolio",
            createdAt: l.created_at,
            href: "/dashboard",
            unread: false,
          };
        });
      }

      const messageNotifs: Notification[] = (msgs ?? []).map((m) => {
        const sender = senderMap[m.sender_id];
        const name = sender?.full_name || sender?.username || "Someone";
        return {
          key: `msg-${m.id}`,
          kind: "message" as const,
          title: `New message from ${name}`,
          subtitle: m.deleted_for_everyone ? "Message deleted" : "Tap to open conversation",
          createdAt: m.created_at,
          href: "/dashboard/inbox",
          unread: !m.is_read,
        };
      });

      const merged = [...messageNotifs, ...likeNotifs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setNotifications(merged);
    };

    loadAll();

    // Realtime: messages received
    const msgChannel = supabase
      .channel(`notif-msg-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => loadAll(),
      )
      .subscribe();

    // Realtime: likes on any portfolio (we filter client-side via reload)
    const likeChannel = supabase
      .channel(`notif-likes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "likes" },
        () => loadAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(likeChannel);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user || unreadMessages === 0) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadMessages(0);
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, unread: false })) : prev));
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadMessages > 0 && (
            <Badge
              variant="default"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold leading-none flex items-center justify-center rounded-full"
            >
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="font-heading font-semibold text-sm">Notifications</p>
          {unreadMessages > 0 && (
            <span className="text-xs text-muted-foreground">{unreadMessages} unread</span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications === null ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              You have no notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.key}
                to={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-secondary transition-colors",
                  n.unread && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    n.kind === "message" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent",
                  )}
                >
                  {n.kind === "message" ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {n.unread && (
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" aria-label="Unread" />
                )}
              </Link>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleMarkAllRead}
            disabled={unreadMessages === 0}
          >
            Mark all as read
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
