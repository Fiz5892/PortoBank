import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MailPlus, Search, Inbox as InboxIcon, Send, ArrowLeft } from "lucide-react";
import EmptyState from "@/components/layout/EmptyState";
import { useSEO } from "@/hooks/useSEO";
import { cn } from "@/lib/utils";

interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface UserInfo {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partnerId: string;
  partner?: UserInfo;
  lastMessage: MessageRow;
  unreadCount: number;
}

type FilterMode = "all" | "unread" | "read";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
};

const Inbox = () => {
  const { user } = useAuth();
  useSEO({ title: "Inbox — PortoBank", description: "Chat with people who reached out from your portfolio." });

  const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  // Composer
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // New message
  const [newOpen, setNewOpen] = useState(false);
  const [newSearch, setNewSearch] = useState("");
  const [newResults, setNewResults] = useState<UserInfo[]>([]);
  const [newRecipient, setNewRecipient] = useState<UserInfo | null>(null);
  const [newBody, setNewBody] = useState("");

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    const msgs = (data ?? []) as MessageRow[];
    setAllMessages(msgs);

    const partnerIds = Array.from(
      new Set(msgs.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))),
    );
    if (partnerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", partnerIds);
      const map: Record<string, UserInfo> = {};
      (profs ?? []).forEach((p) => {
        map[p.user_id] = p as UserInfo;
      });
      setUsers(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));

    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Build conversations grouped per partner
  const conversations: Conversation[] = useMemo(() => {
    if (!user) return [];
    const grouped = new Map<string, MessageRow[]>();
    for (const m of allMessages) {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const arr = grouped.get(partnerId) ?? [];
      arr.push(m);
      grouped.set(partnerId, arr);
    }
    const list: Conversation[] = [];
    grouped.forEach((msgs, partnerId) => {
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.receiver_id === user.id && !m.is_read).length;
      list.push({
        partnerId,
        partner: users[partnerId],
        lastMessage: last,
        unreadCount: unread,
      });
    });
    list.sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
    );
    return list;
  }, [allMessages, users, user]);

  const filteredConversations = useMemo(() => {
    if (filter === "all") return conversations;
    if (filter === "unread") return conversations.filter((c) => c.unreadCount > 0);
    return conversations.filter((c) => c.unreadCount === 0);
  }, [conversations, filter]);

  const activeMessages = useMemo(() => {
    if (!user || !activePartnerId) return [];
    return allMessages.filter(
      (m) =>
        (m.sender_id === user.id && m.receiver_id === activePartnerId) ||
        (m.sender_id === activePartnerId && m.receiver_id === user.id),
    );
  }, [allMessages, activePartnerId, user]);

  const activePartner = activePartnerId ? users[activePartnerId] : undefined;

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!user || !activePartnerId) return;
    const unreadIds = allMessages
      .filter(
        (m) => m.sender_id === activePartnerId && m.receiver_id === user.id && !m.is_read,
      )
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", unreadIds)
      .then(() => {
        setAllMessages((prev) =>
          prev.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m)),
        );
      });
  }, [activePartnerId, allMessages, user]);

  // Auto-scroll to bottom on new messages / conversation switch
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages.length, activePartnerId]);

  const sendMessage = async () => {
    if (!user || !activePartnerId || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activePartnerId,
      subject: null,
      body: draft.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send");
      return;
    }
    setDraft("");
    refresh();
  };

  // Search public users for new message
  useEffect(() => {
    if (!newOpen) return;
    const t = setTimeout(async () => {
      if (newSearch.trim().length < 2) {
        setNewResults([]);
        return;
      }
      const term = `%${newSearch.trim()}%`;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .eq("is_public", true)
        .eq("is_active", true)
        .neq("role", "admin")
        .or(`full_name.ilike.${term},username.ilike.${term}`)
        .limit(8);
      setNewResults((data ?? []) as UserInfo[]);
    }, 250);
    return () => clearTimeout(t);
  }, [newSearch, newOpen]);

  const startNewConversation = async () => {
    if (!user || !newRecipient || !newBody.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: newRecipient.user_id,
      subject: null,
      body: newBody.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send");
      return;
    }
    toast.success("Message sent");
    setUsers((prev) => ({ ...prev, [newRecipient.user_id]: newRecipient }));
    setActivePartnerId(newRecipient.user_id);
    setNewOpen(false);
    setNewRecipient(null);
    setNewSearch("");
    setNewBody("");
    refresh();
  };

  const initialsOf = (s?: UserInfo | null) =>
    (s?.full_name || s?.username || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground mt-1">
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}` : "All caught up."}
            </p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" /> New Message
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card className={cn("p-2 shadow-subtle max-h-[75vh] overflow-y-auto", activePartnerId && "hidden lg:block")}>
            {/* Filter chips */}
            <div className="flex gap-1.5 p-2">
              {(["all", "unread", "read"] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground/70 hover:bg-secondary/70",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title={filter === "all" ? "No conversations yet" : `No ${filter} chats`}
                description={
                  filter === "all"
                    ? "Start a conversation or wait for someone to reach out."
                    : "Try a different filter."
                }
                action={
                  filter === "all" ? (
                    <Button onClick={() => setNewOpen(true)}>
                      <MailPlus className="mr-2 h-4 w-4" /> Compose a message
                    </Button>
                  ) : undefined
                }
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col">
                {filteredConversations.map((c) => {
                  const active = activePartnerId === c.partnerId;
                  const isMine = user && c.lastMessage.sender_id === user.id;
                  return (
                    <li key={c.partnerId}>
                      <button
                        onClick={() => setActivePartnerId(c.partnerId)}
                        className={cn(
                          "w-full text-left p-3 rounded-md flex gap-3 transition-colors",
                          active ? "bg-primary/10" : "hover:bg-secondary",
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {c.partner?.avatar_url && (
                            <AvatarImage src={c.partner.avatar_url} alt={c.partner.full_name ?? ""} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initialsOf(c.partner)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm truncate", c.unreadCount > 0 && "font-semibold")}>
                              {c.partner?.full_name || c.partner?.username || "Unknown"}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(c.lastMessage.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className={cn(
                                "text-xs truncate",
                                c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {isMine && "You: "}
                              {c.lastMessage.body}
                            </p>
                            {c.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0">
                                {c.unreadCount > 9 ? "9+" : c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className={cn("shadow-subtle flex flex-col h-[75vh]", !activePartnerId && "hidden lg:flex")}>
            {activePartnerId && activePartner ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8"
                    onClick={() => setActivePartnerId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    {activePartner.avatar_url && (
                      <AvatarImage src={activePartner.avatar_url} alt={activePartner.full_name ?? ""} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initialsOf(activePartner)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {activePartner.full_name || activePartner.username || "Unknown"}
                    </p>
                    {activePartner.username && (
                      <p className="text-xs text-muted-foreground truncate">@{activePartner.username}</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                  {activeMessages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-subtle",
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card text-foreground rounded-bl-sm border",
                          )}
                        >
                          <p>{m.body}</p>
                          <p
                            className={cn(
                              "text-[10px] mt-1 text-right",
                              mine ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <div className="p-3 border-t flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="resize-none min-h-[40px] max-h-32"
                  />
                  <Button onClick={sendMessage} disabled={sending || !draft.trim()} size="icon" className="shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation to start chatting.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New message modal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>Search a public user to message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              {newRecipient ? (
                <div className="mt-1.5 flex items-center justify-between p-2.5 border rounded-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-7 w-7">
                      {newRecipient.avatar_url && (
                        <AvatarImage src={newRecipient.avatar_url} alt={newRecipient.full_name ?? ""} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initialsOf(newRecipient)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">
                      {newRecipient.full_name || newRecipient.username}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setNewRecipient(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or username..."
                      className="pl-9"
                      value={newSearch}
                      onChange={(e) => setNewSearch(e.target.value)}
                    />
                  </div>
                  {newResults.length > 0 && (
                    <ul className="mt-2 border rounded-md max-h-52 overflow-y-auto">
                      {newResults.map((r) => (
                        <li key={r.user_id}>
                          <button
                            onClick={() => {
                              setNewRecipient(r);
                              setNewResults([]);
                              setNewSearch("");
                            }}
                            className="w-full text-left p-2.5 flex items-center gap-2 hover:bg-secondary"
                          >
                            <Avatar className="h-7 w-7">
                              {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.full_name ?? ""} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initialsOf(r)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{r.full_name || r.username}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor="n-body">Message</Label>
              <Textarea
                id="n-body"
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Write your message..."
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={startNewConversation}
              disabled={sending || !newRecipient || !newBody.trim()}
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Inbox;
