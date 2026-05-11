import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoginToActModal from "./LoginToActModal";

interface LikeButtonProps {
  /** The portfolio owner's user_id. We resolve their first published portfolio internally. */
  ownerUserId: string;
  /** Optional pre-resolved portfolio_id (skips a lookup). */
  portfolioId?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline";
  className?: string;
  /** Stop click bubbling (useful inside cards that link to a profile). */
  stopPropagation?: boolean;
}

const LikeButton = ({
  ownerUserId,
  portfolioId: portfolioIdProp,
  size = "sm",
  variant = "outline",
  className,
  stopPropagation,
}: LikeButtonProps) => {
  const { user } = useAuth();
  const [portfolioId, setPortfolioId] = useState<string | null>(portfolioIdProp ?? null);
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let pid = portfolioIdProp ?? null;
      if (!pid) {
        const { data } = await supabase
          .from("portfolios")
          .select("id")
          .eq("user_id", ownerUserId)
          .eq("is_published", true)
          .limit(1);
        pid = data?.[0]?.id ?? null;
      }
      if (cancelled) return;
      setPortfolioId(pid);

      if (!pid) {
        setCount(0);
        setLiked(false);
        setLoading(false);
        return;
      }

      const [{ count: c }, mine] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("portfolio_id", pid),
        user
          ? supabase
              .from("likes")
              .select("id")
              .eq("user_id", user.id)
              .eq("portfolio_id", pid)
              .maybeSingle()
          : Promise.resolve({ data: null } as { data: { id: string } | null }),
      ]);
      if (cancelled) return;
      setCount(c ?? 0);
      setLiked(!!mine.data);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [ownerUserId, portfolioIdProp, user]);

  const handleClick = async (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!portfolioId) return;

    // Optimistic toggle
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    if (wasLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("portfolio_id", portfolioId);
      if (error) {
        // revert
        setLiked(true);
        setCount((c) => c + 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, portfolio_id: portfolioId });
      if (error) {
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
      }
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={loading || !portfolioId}
        aria-pressed={liked}
        aria-label={liked ? "Unlike portfolio" : "Like portfolio"}
        className={cn(liked && "text-primary border-primary/40", className)}
      >
        <Heart
          className={cn("h-4 w-4 mr-1.5 transition-transform", liked && "fill-current scale-110")}
        />
        <span className="tabular-nums">{count}</span>
      </Button>
      <LoginToActModal
        open={showLogin}
        onOpenChange={setShowLogin}
        title="Login to like portfolios"
        description="Sign in to like and follow your favorite creators."
      />
    </>
  );
};

export default LikeButton;
