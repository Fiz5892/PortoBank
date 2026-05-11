import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const schema = z.object({ email: z.string().trim().email("Email tidak valid").max(255) });

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useSEO({
    title: "Lupa Password — PortoBank",
    description: "Reset password akun PortoBank Anda lewat email.",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <Layout>
      <section className="container py-12 md:py-20 flex justify-center">
        <Card className="w-full max-w-md p-8 shadow-subtle">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-heading text-2xl font-bold">Cek email Anda</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Kami sudah mengirim link reset password ke <span className="font-medium">{email}</span>. Klik link tersebut untuk membuat password baru.
              </p>
              <Button asChild className="mt-6 w-full">
                <a href="https://mail.google.com" target="_blank" rel="noreferrer">Buka Gmail</a>
              </Button>
              <Link to="/login" className="block mt-4 text-sm text-primary hover:underline">
                Kembali ke Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-heading text-2xl font-bold">Lupa password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan email Anda dan kami akan kirim link reset.
                </p>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Kirim link reset
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Ingat password Anda?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </section>
    </Layout>
  );
};

export default ForgotPassword;
