import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/layout/EmptyState";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  Inbox as InboxIcon,
  Loader2,
  MailPlus,
  MoreVertical,
  Pencil,
  Search,
  Send,
  Smile,
  Trash2,
} from "lucide-react";

import EmojiPicker, { Theme } from "emoji-picker-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

import { supabase } from "@/integrations/supabase/client";

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
}

type FilterMode = "all" | "unread" | "read";

const formatListTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return d.toLocaleDateString();
};

const Inbox = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: "Inbox — PortoBank",
    description: "Chat with people who reached out from your portfolio.",
  });

  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<Message[]>([]);

  const [users, setUsers] = useState<Record<string, UserInfo>>({});

  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [filter, setFilter] = useState<FilterMode>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [emojiOpen, setEmojiOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activePartner = activePartnerId
    ? users[activePartnerId]
    : undefined;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const loadConversations = async () => {
    const { data, error } = await supabase.rpc("get_conversations");

    if (error) {
      console.error(error);
      return;
    }

    setConversations(data || []);
  };

  const loadThread = async (partnerId: string) => {
    const { data, error } = await supabase.rpc("get_thread", {
      p_partner_id: partnerId,
    });

    if (error) {
      console.error(error);
      return;
    }

    setThread(data || []);
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    loadConversations().finally(() => {
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!activePartnerId) return;

    loadThread(activePartnerId);
  }, [activePartnerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [thread]);

  const sendMessage = async () => {
    if (!draft.trim() || !activePartnerId) return;

    setSending(true);

    const { error } = await supabase.rpc("send_message", {
      p_receiver_id: activePartnerId,
      p_body: draft.trim(),
    });

    setSending(false);

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setDraft("");

    loadThread(activePartnerId);
    loadConversations();
  };

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (filter === "unread") {
      filtered = filtered.filter((c) => c.unread_count > 0);
    }

    if (filter === "read") {
      filtered = filtered.filter((c) => c.unread_count === 0);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((c) => {
        const partner = users[c.partner_id];

        return (
          partner?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          partner?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered;
  }, [conversations, filter, searchQuery, users]);

  if (authLoading || !user) {
    return (
      <Layout showFooter={false}>
        <div className="container flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-6">
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

          {/* Sidebar */}
          <Card className="p-2">

            <div className="flex items-center justify-between p-2">
              <h1 className="text-xl font-bold">Inbox</h1>

              <Button size="sm">
                <MailPlus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>

            <div className="relative p-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title="No conversation"
                description="Your inbox is empty."
              />
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((c) => {
                  const partner = users[c.partner_id];

                  return (
                    <button
                      key={c.partner_id}
                      onClick={() =>
                        setActivePartnerId(c.partner_id)
                      }
                      className="w-full flex gap-3 p-3 rounded-lg hover:bg-secondary text-left"
                    >
                      <Avatar>
                        <AvatarImage
                          src={partner?.avatar_url || ""}
                        />
                        <AvatarFallback>
                          {partner?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {partner?.full_name ||
                            partner?.username}
                        </p>

                        <p className="text-xs text-muted-foreground truncate">
                          {c.last_body}
                        </p>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {formatListTime(c.last_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Chat Area */}
          <Card className="flex flex-col h-[80vh]">

            {activePartner ? (
              <>
                <div className="border-b p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={activePartner.avatar_url || ""}
                    />
                    <AvatarFallback>
                      {activePartner.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-semibold">
                      {activePartner.full_name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      @{activePartner.username}
                    </p>
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {thread.map((m) => {
                    const mine = m.sender_id === user.id;

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          mine
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 max-w-[75%]",
                            mine
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          )}
                        >
                          <p className="text-sm">
                            {m.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t p-3 flex gap-2">
                  <Popover
                    open={emojiOpen}
                    onOpenChange={setEmojiOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="p-0 border-none w-auto">
                      <EmojiPicker
                        theme={Theme.LIGHT}
                        onEmojiClick={(e) =>
                          setDraft((d) => d + e.emoji)
                        }
                      />
                    </PopoverContent>
                  </Popover>

                  <Textarea
                    value={draft}
                    onChange={(e) =>
                      setDraft(e.target.value)
                    }
                    placeholder="Type a message..."
                    className="min-h-[42px]"
                  />

                  <Button
                    size="icon"
                    onClick={sendMessage}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation
              </div>
            )}
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Inbox;