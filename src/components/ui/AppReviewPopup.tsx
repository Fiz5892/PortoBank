import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

const LOCAL_STORAGE_KEY = "portobank_hide_review_popup";

export function AppReviewPopup() {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (authLoading || !user || hasChecked) return;

    const checkShouldShow = async () => {
      // Check local storage first
      const hidePopup = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (hidePopup === "true") {
        setHasChecked(true);
        return;
      }

      // Check database to see if user has already reviewed
      try {
        const { data, error } = await supabase
          .from("app_reviews")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking review status:", error);
        }

        if (data) {
          // User has reviewed, hide forever
          localStorage.setItem(LOCAL_STORAGE_KEY, "true");
        } else {
          // Show popup
          setOpen(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setHasChecked(true);
      }
    };

    // Small delay to not immediately pop up on first render
    const timeout = setTimeout(() => {
      checkShouldShow();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [user, authLoading, hasChecked]);

  const handleDontShowAgain = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Silakan berikan rating bintang terlebih dahulu.");
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("app_reviews").insert({
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      toast.success("Terima kasih atas ulasan Anda!");
      localStorage.setItem(LOCAL_STORAGE_KEY, "true");
      setOpen(false);
    } catch (error: any) {
      console.error("Submit review error:", error);
      toast.error("Gagal mengirim ulasan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Do not render anything if not open
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bagaimana pengalaman Anda?</DialogTitle>
          <DialogDescription>
            Bantu kami meningkatkan PortoBank dengan memberikan rating dan ulasan Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    (hoverRating || rating) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
            <Textarea
              placeholder="Ceritakan pengalaman Anda menggunakan PortoBank (opsional)..."
              className="resize-none"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            className="sm:mr-auto text-muted-foreground"
            onClick={handleDontShowAgain}
            disabled={submitting}
          >
            Jangan tampilkan lagi
          </Button>
          <div className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Nanti saja
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Ulasan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
