import { useEffect, useState } from "react";
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
import { Loader2, MailPlus, Reply, Search } from "lucide-react";
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

interface SenderInfo {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface PublicUser {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

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
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [senders, setSenders] = useState<Record<string, SenderInfo>>({});
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Reply
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  // New message
  const [newOpen, setNewOpen] = useState(false);
  const [newSearch, setNewSearch] = useState("");
  const [newResults, setNewResults] = useState<PublicUser[]>([]);
  const [newRecipient, setNewRecipient] = useState<PublicUser | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    const msgs = (data ?? []) as MessageRow[];
    setMessages(msgs);

    const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)));
    if (senderIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", senderIds);
      const map: Record<string, SenderInfo> = {};
      (profs ?? []).forEach((p) => {
        map[p.user_id] = p as SenderInfo;
      });
      setSenders(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user]);

  const openMessage = async (m: MessageRow) => {
    setSelected(m);
    if (!m.is_read) {
      await supabase.from("messages").update({ is_read: true }).eq("id", m.id);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)));
    }
  };

  const sendReply = async () => {
    if (!user || !selected || !replyBody.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selected.sender_id,
      subject: selected.subject ? `Re: ${selected.subject.replace(/^Re:\s*/, "")}` : "Re:",
      body: replyBody.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send reply");
      return;
    }
    toast.success("Reply sent");
    setReplyBody("");
    setReplyOpen(false);
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
        .or(`full_name.ilike.${term},username.ilike.${term}`)
        .limit(8);
      setNewResults((data ?? []) as PublicUser[]);
    }, 250);
    return () => clearTimeout(t);
  }, [newSearch, newOpen]);

  const sendNewMessage = async () => {
    if (!user || !newRecipient || !newBody.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: newRecipient.user_id,
      subject: newSubject.trim() || null,
      body: newBody.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send");
      return;
    }
    toast.success("Message sent");
    setNewOpen(false);
    setNewRecipient(null);
    setNewSearch("");
    setNewSubject("");
    setNewBody("");
  };

  const initialsOf = (s?: SenderInfo | PublicUser | null) =>
    (s?.full_name || s?.username || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground mt-1">Messages from people who reached out.</p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" /> New Message
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="p-2 shadow-subtle max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No messages yet.</div>
            ) : (
              <ul className="flex flex-col">
                {messages.map((m) => {
                  const s = senders[m.sender_id];
                  const active = selected?.id === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => openMessage(m)}
                        className={cn(
                          "w-full text-left p-3 rounded-md flex gap-3 transition-colors",
                          active ? "bg-primary/10" : "hover:bg-secondary",
                        )}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          {s?.avatar_url && <AvatarImage src={s.avatar_url} alt={s.full_name ?? ""} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initialsOf(s)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm truncate", !m.is_read && "font-semibold")}>
                              {s?.full_name || s?.username || "Unknown"}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">{formatTime(m.created_at)}</span>
                          </div>
                          <p className={cn("text-xs text-muted-foreground truncate mt-0.5", !m.is_read && "text-foreground")}>
                            {m.subject || m.body.slice(0, 50)}
                          </p>
                        </div>
                        {!m.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-6 shadow-subtle min-h-[300px]">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading font-semibold">{selected.subject || "(no subject)"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      From {senders[selected.sender_id]?.full_name || "Unknown"} ·{" "}
                      {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setReplyOpen(true)}>
                    <Reply className="mr-2 h-4 w-4" /> Reply
                  </Button>
                </div>
                <div className="border-t pt-4 whitespace-pre-wrap text-sm text-foreground/90">{selected.body}</div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-12">
                Select a message to read.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reply modal */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply</DialogTitle>
            <DialogDescription>
              To {senders[selected?.sender_id ?? ""]?.full_name || "sender"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            placeholder="Write your reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendReply} disabled={sending || !replyBody.trim()}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
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
              <Label htmlFor="n-subject">Subject</Label>
              <Input
                id="n-subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="n-body">Message</Label>
              <Textarea
                id="n-body"
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendNewMessage}
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
