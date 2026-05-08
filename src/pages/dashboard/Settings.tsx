import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Eye } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [updating, setUpdating] = useState(false);
  const [notif, setNotif] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_public")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsPublic(data.is_public);
      });
  }, [user]);

  const toggleVisibility = async (next: boolean) => {
    if (!user) return;
    setIsPublic(next);
    const { error } = await supabase
      .from("profiles")
      .update({ is_public: next })
      .eq("user_id", user.id);
    if (error) {
      setIsPublic(!next);
      toast.error("Could not update visibility");
    } else {
      toast.success(next ? "Portofolio sekarang publik" : "Portofolio diatur ke privat");
    }
  };

  const updatePassword = async () => {
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pwd !== pwdConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setUpdating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPwd("");
    setPwdConfirm("");
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    // Cascade-delete the user's profile (ON DELETE CASCADE handles related rows where set up)
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
    setDeleting(false);
    toast.success("Account deleted");
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
        </div>

        <Card className="p-6 shadow-subtle space-y-4">
          <h2 className="font-heading font-semibold">Change password</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-pwd">New password</Label>
              <Input
                id="s-pwd"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="s-pwd2">Confirm</Label>
              <Input
                id="s-pwd2"
                type="password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={updatePassword} disabled={updating || !pwd || !pwdConfirm}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-subtle">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-heading font-semibold">Email notifications</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Get notified when you receive a new message.
              </p>
            </div>
            <Switch
              checked={notif}
              onCheckedChange={(v) => {
                setNotif(v);
                toast.success(v ? "Notifications enabled" : "Notifications disabled");
              }}
            />
          </div>
        </Card>

        <Card className="p-6 shadow-subtle border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-destructive">Danger zone</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setConfirmDelete(true)}
              >
                Delete account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your profile, portfolio, and skills. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Settings;
