import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AppealRow {
  id: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const Suspended = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<AppealRow[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("suspension_appeals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setAppeals((data ?? []) as AppealRow[]);
      setLoading(false);
    };
    load();
  }, [user, authLoading, navigate]);

  const submit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("suspension_appeals")
      .insert({ user_id: user.id, message: message.trim() })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit appeal");
      return;
    }
    setAppeals((prev) => [data as AppealRow, ...prev]);
    setMessage("");
    toast.success("Appeal submitted");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const pendingExists = appeals.some((a) => a.status === "pending");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full p-8 shadow-subtle space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Your account is suspended</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Your access to PortoBank has been temporarily disabled. If you believe this is a
            mistake, you can submit an appeal below and our team will review it.
          </p>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {!pendingExists ? (
              <div className="space-y-3">
                <Label htmlFor="appeal">Reactivation request</Label>
                <Textarea
                  id="appeal"
                  rows={5}
                  maxLength={1000}
                  placeholder="Explain why your account should be reactivated..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{message.length}/1000</p>
                  <Button onClick={submit} disabled={submitting || message.trim().length < 10}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit appeal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Your appeal is under review.</p>
                  <p className="text-muted-foreground mt-1">
                    We'll notify you once a decision has been made.
                  </p>
                </div>
              </div>
            )}

            {appeals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Appeal history
                </p>
                <ul className="space-y-2">
                  {appeals.map((a) => (
                    <li key={a.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                            a.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : a.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">{a.message}</p>
                      {a.admin_notes && (
                        <p className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                          <span className="font-medium">Admin response:</span> {a.admin_notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="border-t pt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Suspended;
