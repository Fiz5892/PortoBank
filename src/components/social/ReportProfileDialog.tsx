import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

interface ReportProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  onLoginRequired?: () => void;
}

const ReportProfileDialog = ({
  open,
  onOpenChange,
  targetUserId,
  onLoginRequired,
}: ReportProfileDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
  };

  const handleSubmit = async () => {
    if (!user) {
      onOpenChange(false);
      onLoginRequired?.();
      return;
    }
    if (!reason) {
      toast.error("Please select a reason.");
      return;
    }
    if (user.id === targetUserId) {
      toast.error("You cannot report your own profile.");
      return;
    }
    setSubmitting(true);
    const reasonLabel = REASONS.find((r) => r.value === reason)?.label ?? reason;
    const fullReason = details.trim()
      ? `${reasonLabel}: ${details.trim().slice(0, 500)}`
      : reasonLabel;

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_user_id: targetUserId,
      reason: fullReason,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit report.");
      return;
    }
    toast.success("Report submitted. Our team will review it shortly.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this profile</DialogTitle>
          <DialogDescription>
            Help keep PortoBank safe. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason" className="mt-1.5">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              rows={4}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add any context that would help us review this report."
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{details.length}/500</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportProfileDialog;
