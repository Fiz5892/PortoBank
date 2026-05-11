import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MessagesIcon = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnread(count ?? 0);
    };

    load();

    const channel = supabase.channel(`msg-icon-${user.id}-${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to="/inbox"
      aria-label="Messages"
      className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <MessageSquare className="h-5 w-5 text-foreground" />
      {unread > 0 && (
        <Badge
          variant="default"
          className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold leading-none flex items-center justify-center rounded-full"
        >
          {unread > 9 ? "9+" : unread}
        </Badge>
      )}
    </Link>
  );
};

export default MessagesIcon;
