import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Harus ada huruf besar")
  .regex(/[a-z]/, "Harus ada huruf kecil")
  .regex(/[0-9]/, "Harus ada angka")
  .regex(/[^A-Za-z0-9]/, "Harus ada karakter khusus");

const schema = z
  .object({
    full_name: z.string().trim().min(1, "Nama wajib diisi").max(100),
    email: z.string().trim().email("Email tidak valid").max(255),
    bio: z.string().trim().min(150, "Bio minimal 150 karakter").max(500),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Password tidak cocok",
  });

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", bio: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useSEO({
    title: "Buat akun — PortoBank",
    description: "Buat akun PortoBank gratis dan bangun portofolio profesional dalam hitungan menit.",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/onboarding", { replace: true });
    });
  }, [navigate]);

  const pwdChecks = [
    { label: "Min. 8 karakter", ok: form.password.length >= 8 },
    { label: "Huruf besar (A-Z)", ok: /[A-Z]/.test(form.password) },
    { label: "Huruf kecil (a-z)", ok: /[a-z]/.test(form.password) },
    { label: "Angka (0-9)", ok: /[0-9]/.test(form.password) },
    { label: "Karakter khusus (!@#…)", ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const pwdAllOk = pwdChecks.every((c) => c.ok);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const newErrors: typeof errors = {};
      parsed.error.errors.forEach((err) => {
        const k = err.path[0] as keyof typeof form;
        newErrors[k] = err.message;
      });
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error, data } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: parsed.data.full_name, bio: parsed.data.bio },
      },
    });
    if (!error && data.user) {
      // best-effort: simpan bio ke profil
      await supabase.from("profiles").update({ bio: parsed.data.bio }).eq("user_id", data.user.id);
    }
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Akun dibuat! Silakan cek email Anda untuk verifikasi.", { duration: 6000 });
    navigate("/login");
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/onboarding`,
    });
    if (result.error) toast.error("Gagal masuk dengan Google.");
  };

  return (
    <Layout>
      <section className="container py-12 md:py-20 flex justify-center">
        <Card className="w-full max-w-md p-8 shadow-subtle">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold">Buat akun</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bangun portofolio profesional dalam beberapa menit.
            </p>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Lanjutkan dengan Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">atau dengan email</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nama lengkap</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nama Anda" className="mt-1.5" />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="anda@example.com" className="mt-1.5" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="bio">Bio singkat</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Ceritakan tentang diri Anda, profesi, dan pengalaman (minimal 150 karakter)..."
                className="mt-1.5"
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                {errors.bio ? (
                  <p className="text-xs text-destructive">{errors.bio}</p>
                ) : (
                  <span className="text-xs text-muted-foreground">Min. 150 karakter</span>
                )}
                <span className={`text-xs ${form.bio.length >= 150 ? "text-primary" : "text-muted-foreground"}`}>
                  {form.bio.length}/500
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password.length > 0 && !pwdAllOk && (
                <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-destructive mb-1.5">Password belum memenuhi syarat:</p>
                      <ul className="space-y-0.5">
                        {pwdChecks.map((c) => (
                          <li key={c.label} className={`text-xs ${c.ok ? "text-primary" : "text-destructive/80"}`}>
                            {c.ok ? "✓" : "✗"} {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Konfirmasi password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Sembunyikan password" : "Lihat password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Buat akun
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </Card>
      </section>
    </Layout>
  );
};

export default Register;
