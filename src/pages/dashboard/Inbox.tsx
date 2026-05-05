import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, MailPlus, Search, Inbox as InboxIcon, Send, ArrowLeft,
  MoreVertical, Smile, Check, CheckCheck, Pencil, Trash2,
} from "lucide-react";
import EmptyState from "@/components/layout/EmptyState";
import { useSEO } from "@/hooks/useSEO";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_for_everyone: boolean;
}

interface UserInfo {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partner_id: string;
  last_body: string;
  last_at: string;
  last_sender_id: string;
  last_deleted: boolean;
  unread_count: number;
  partner?: UserInfo;
}

type FilterMode = "all" | "unread" | "read";

const formatListTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString();
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today.getTime() - 86400000);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yest.getTime()) return "Yesterday";
  const diff = (today.getTime() - day.getTime()) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const minutesSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 60000;

const Inbox = () => {
  const { user } = useAuth();
  useSEO({ title: "Inbox — PortoBank", description: "Chat with people who reached out from your portfolio." });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Edit dialog
  const [editing, setEditing] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");

  // New message
  const [newOpen, setNewOpen] = useState(false);
  const [newSearch, setNewSearch] = useState("");
  const [newResults, setNewResults] = useState<UserInfo[]>([]);
  const [newRecipient, setNewRecipient] = useState<UserInfo | null>(null);
  const [newBody, setNewBody] = useState("");

  const ensureUsers = async (ids: string[]) => {
    const missing = ids.filter((id) => !users[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", missing);
    if (data) {
      setUsers((prev) => {
        const next = { ...prev };
        data.forEach((u) => { next[u.user_id] = u as UserInfo; });
        return next;
      });
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_conversations");
    if (error) { console.error(error); return; }
    const convs = (data ?? []) as Conversation[];
    setConversations(convs);
    await ensureUsers(convs.map((c) => c.partner_id));
  };

  const loadThread = async (partnerId: string) => {
    const { data, error } = await supabase.rpc("get_thread", { p_partner_id: partnerId });
    if (error) { console.error(error); return; }
    setThread((data ?? []) as Message[]);
    await supabase.rpc("mark_thread_read", { p_partner_id: partnerId });
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadConversations().finally(() => setLoading(false));

    const channel = supabase.channel(`inbox-${user.id}-${Math.random().toString(36).slice(2)}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadConversations();
        if (activePartnerId) loadThread(activePartnerId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activePartnerId) loadThread(activePartnerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartnerId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.length, activePartnerId]);

  const filteredConversations = useMemo(() => {
    if (filter === "all") return conversations;
    if (filter === "unread") return conversations.filter((c) => c.unread_count > 0);
    return conversations.filter((c) => c.unread_count === 0);
  }, [conversations, filter]);

  const activePartner = activePartnerId ? users[activePartnerId] : undefined;

  const sendMessage = async () => {
    if (!user || !activePartnerId || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.rpc("send_message", {
      p_receiver_id: activePartnerId,
      p_body: draft.trim(),
    });
    setSending(false);
    if (error) { toast.error("Could not send"); return; }
    setDraft("");
    loadThread(activePartnerId);
    loadConversations();
  };

  useEffect(() => {
    if (!newOpen) return;
    const t = setTimeout(async () => {
      if (newSearch.trim().length < 2) { setNewResults([]); return; }
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
    const { error } = await supabase.rpc("send_message", {
      p_receiver_id: newRecipient.user_id,
      p_body: newBody.trim(),
    });
    setSending(false);
    if (error) { toast.error("Could not send"); return; }
    toast.success("Message sent");
    setUsers((prev) => ({ ...prev, [newRecipient.user_id]: newRecipient }));
    setActivePartnerId(newRecipient.user_id);
    setNewOpen(false);
    setNewRecipient(null);
    setNewSearch("");
    setNewBody("");
    loadConversations();
  };

  const handleEdit = async () => {
    if (!editing || !editText.trim()) return;
    const { error } = await supabase.rpc("edit_message", {
      p_message_id: editing.id,
      p_new_body: editText.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setEditing(null);
    if (activePartnerId) loadThread(activePartnerId);
    loadConversations();
  };

  const handleDeleteForEveryone = async (m: Message) => {
    const { error } = await supabase.rpc("delete_message_for_everyone", { p_message_id: m.id });
    if (error) { toast.error(error.message); return; }
    if (activePartnerId) loadThread(activePartnerId);
    loadConversations();
  };

  const handleDeleteForMe = async (m: Message) => {
    const { error } = await supabase.rpc("delete_message_for_me", { p_message_id: m.id });
    if (error) { toast.error(error.message); return; }
    if (activePartnerId) loadThread(activePartnerId);
    loadConversations();
  };

  const initialsOf = (s?: UserInfo | null) =>
    (s?.full_name || s?.username || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  // Group thread messages by day
  const threadGroups = useMemo(() => {
    const groups: { day: string; items: Message[] }[] = [];
    for (const m of thread) {
      const label = dayLabel(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.day === label) last.items.push(m);
      else groups.push({ day: label, items: [m] });
    }
    return groups;
  }, [thread]);

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
            <div className="flex gap-1.5 p-2">
              {(["all", "unread", "read"] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors",
                    filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/70",
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
                description={filter === "all" ? "Start a conversation or wait for someone to reach out." : "Try a different filter."}
                action={filter === "all" ? (
                  <Button onClick={() => setNewOpen(true)}>
                    <MailPlus className="mr-2 h-4 w-4" /> Compose a message
                  </Button>
                ) : undefined}
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col">
                {filteredConversations.map((c) => {
                  const partner = users[c.partner_id];
                  const active = activePartnerId === c.partner_id;
                  const isMine = user && c.last_sender_id === user.id;
                  return (
                    <li key={c.partner_id}>
                      <button
                        onClick={() => setActivePartnerId(c.partner_id)}
                        className={cn(
                          "w-full text-left p-3 rounded-md flex gap-3 transition-colors",
                          active ? "bg-primary/10" : "hover:bg-secondary",
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {partner?.avatar_url && <AvatarImage src={partner.avatar_url} alt={partner.full_name ?? ""} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initialsOf(partner)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm truncate", c.unread_count > 0 && "font-semibold")}>
                              {partner?.full_name || partner?.username || "Unknown"}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatListTime(c.last_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={cn("text-xs truncate", c.unread_count > 0 ? "text-foreground" : "text-muted-foreground", c.last_deleted && "italic")}>
                              {c.last_deleted ? "Message deleted" : (<>{isMine && "You: "}{c.last_body}</>)}
                            </p>
                            {c.unread_count > 0 && (
                              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0">
                                {c.unread_count > 9 ? "9+" : c.unread_count}
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
                <div className="flex items-center gap-3 p-4 border-b">
                  <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setActivePartnerId(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Link
                    to={activePartner.username ? `/${activePartner.username}` : "#"}
                    className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-9 w-9">
                      {activePartner.avatar_url && <AvatarImage src={activePartner.avatar_url} alt={activePartner.full_name ?? ""} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initialsOf(activePartner)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{activePartner.full_name || activePartner.username || "Unknown"}</p>
                      {activePartner.username && (
                        <p className="text-xs text-muted-foreground truncate">@{activePartner.username}</p>
                      )}
                    </div>
                  </Link>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
                  {threadGroups.map((g) => (
                    <div key={g.day} className="space-y-2">
                      <div className="flex justify-center my-2">
                        <span className="text-[11px] bg-background px-3 py-1 rounded-full text-muted-foreground border">
                          {g.day}
                        </span>
                      </div>
                      {g.items.map((m) => {
                        const mine = m.sender_id === user?.id;
                        const canEdit = mine && !m.deleted_for_everyone && minutesSince(m.created_at) < 10;
                        const canDeleteAll = mine && !m.deleted_for_everyone && minutesSince(m.created_at) < 360;
                        return (
                          <div key={m.id} className={cn("flex group", mine ? "justify-end" : "justify-start")}>
                            <div className={cn("relative max-w-[75%] rounded-2xl shadow-subtle", mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-foreground rounded-bl-sm border")}>
                              {m.deleted_for_everyone ? (
                                <div className="px-3.5 py-2 text-sm italic opacity-70 flex items-center gap-2">
                                  <Trash2 className="h-3 w-3" />
                                  This message was deleted
                                </div>
                              ) : (
                                <div className="px-3.5 py-1.5 pb-1">
                                  <div className="flex items-end gap-2">
                                    <p className="text-sm whitespace-pre-wrap break-words flex-1">{m.body}</p>
                                    <span className={cn("text-[10px] shrink-0 self-end pb-0.5 inline-flex items-center gap-1", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                      {m.edited_at && <em className="opacity-70">edited</em>}
                                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      {mine && (m.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {!m.deleted_for_everyone && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className={cn("absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-background border flex items-center justify-center", mine ? "-left-2" : "-right-2")}>
                                      <MoreVertical className="h-3 w-3 text-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={mine ? "start" : "end"}>
                                    {canEdit && (
                                      <DropdownMenuItem onClick={() => { setEditing(m); setEditText(m.body); }}>
                                        <Pencil className="h-3.5 w-3.5 mr-2" /> Edit (10 min)
                                      </DropdownMenuItem>
                                    )}
                                    {canDeleteAll && (
                                      <DropdownMenuItem onClick={() => handleDeleteForEveryone(m)} className="text-destructive">
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete for everyone
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDeleteForMe(m)}>
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete for me
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t flex items-end gap-2">
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="p-0 border-none w-auto">
                      <EmojiPicker
                        theme={Theme.LIGHT}
                        onEmojiClick={(e) => { setDraft((d) => d + e.emoji); }}
                        width={320}
                        height={380}
                      />
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
            <DialogDescription>You can edit messages within 10 minutes of sending.</DialogDescription>
          </DialogHeader>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editText.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      {newRecipient.avatar_url && <AvatarImage src={newRecipient.avatar_url} alt={newRecipient.full_name ?? ""} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initialsOf(newRecipient)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{newRecipient.full_name || newRecipient.username}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setNewRecipient(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or username..." className="pl-9" value={newSearch} onChange={(e) => setNewSearch(e.target.value)} />
                  </div>
                  {newResults.length > 0 && (
                    <ul className="mt-2 border rounded-md max-h-52 overflow-y-auto">
                      {newResults.map((r) => (
                        <li key={r.user_id}>
                          <button
                            onClick={() => { setNewRecipient(r); setNewResults([]); setNewSearch(""); }}
                            className="w-full text-left p-2.5 flex items-center gap-2 hover:bg-secondary"
                          >
                            <Avatar className="h-7 w-7">
                              {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.full_name ?? ""} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initialsOf(r)}</AvatarFallback>
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
              <Textarea id="n-body" rows={5} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Write your message..." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={startNewConversation} disabled={sending || !newRecipient || !newBody.trim()}>
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
