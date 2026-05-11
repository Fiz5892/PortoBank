import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useSEO({
    title: "Reset Password — PortoBank",
    description: "Buat password baru untuk akun PortoBank Anda.",
  });

  useEffect(() => {
    // Supabase fires a PASSWORD_RECOVERY event when the user lands here from the email link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("Password tidak cocok");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password berhasil diperbarui");
    navigate("/dashboard", { replace: true });
  };

  return (
    <Layout>
      <section className="container py-12 md:py-20 flex justify-center">
        <Card className="w-full max-w-md p-8 shadow-subtle">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold">Reset password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan password baru Anda.
            </p>
          </div>
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">
              Buka link dari email Anda untuk melanjutkan reset password.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pwd">Password baru</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="pwd"
                    type={show ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="pwd2">Konfirmasi password</Label>
                <Input
                  id="pwd2"
                  type={show ? "text" : "password"}
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
        </Card>
      </section>
    </Layout>
  );
};

export default ResetPassword;
