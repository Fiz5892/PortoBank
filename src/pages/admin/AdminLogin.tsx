import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Admin Login — PortoBank";
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast({ title: "Login failed", description: error?.message ?? "Invalid credentials", variant: "destructive" });
      return;
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (!roleRow) {
      await supabase.auth.signOut();
      toast({ title: "Unauthorized", description: "This account is not an admin.", variant: "destructive" });
      return;
    }
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <Card className="border-slate-700/60 bg-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <CardHeader className="bg-slate-900/50 border-b border-slate-700/50 text-center px-8 pt-8 pb-6 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-900/60 border border-blue-700/50">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
                PortoBank Admin
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Sign in to access the control panel
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-800/50">
              <Lock className="h-3 w-3" /> Secure access only
            </span>
          </CardHeader>

          {/* Form */}
          <CardContent className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@portobank.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-900/60 border-slate-600/60 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" /> Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-slate-900/60 border-slate-600/60 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-blue-700 hover:bg-blue-600 text-white font-medium gap-2 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Sign in
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-700/60" />
                <span className="text-xs text-slate-500">admin accounts only</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;