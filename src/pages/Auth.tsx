import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";

const emailSchema = z.string().trim().email({ message: "E-mail inválido" }).max(255);
const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  .max(72, { message: "Senha muito longa" });

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // register
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [authLoading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      if (!loginPassword) throw new Error("Informe sua senha");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: "Erro", description: msg, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? "E-mail ou senha incorretos"
        : error.message.includes("Email not confirmed")
        ? "Confirme seu e-mail antes de entrar"
        : error.message;
      toast({ title: "Erro ao entrar", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Bem-vinda de volta!" });
    navigate("/", { replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(regEmail);
      passwordSchema.parse(regPassword);
      if (!lgpdConsent) throw new Error("Você precisa aceitar a política de privacidade");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: "Erro", description: msg, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { lgpd_consent: true },
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("already registered")
        ? "E-mail já cadastrado"
        : error.message;
      toast({ title: "Erro ao registrar", description: msg, variant: "destructive" });
      return;
    }
    // Marca consentimento LGPD após criação (será aplicado na próxima sessão)
    toast({
      title: "Cadastro realizado!",
      description: "Verifique seu e-mail para confirmar a conta.",
    });
    setTab("login");
  };


  const handleForgot = async () => {
    if (!loginEmail) {
      toast({ title: "Informe seu e-mail acima primeiro", variant: "destructive" });
      return;
    }
    try {
      emailSchema.parse(loginEmail);
    } catch {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Verifique seu e-mail para redefinir a senha" });
  };

  return (
    <MobileLayout>
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-foreground">Acesse sua conta</h1>
      </div>

      <div className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
          <TabsList className="w-full grid grid-cols-2 bg-secondary rounded-xl h-10">
            <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg">Registrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                  placeholder="Insira seu E-mail"
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-9 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                  placeholder="Insira sua senha"
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9 rounded-xl"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleForgot}
                className="text-xs text-primary hover:underline"
              >
                Esqueci a senha
              </button>
              <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6 space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email">E-mail</Label>
                <Input
                placeholder="Insira seu E-mail"
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha (mín. 8 caracteres)</Label>
                <Input
                placeholder="Insira sua senha"
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="lgpd"
                  checked={lgpdConsent}
                  onCheckedChange={(c) => setLgpdConsent(!!c)}
                  className="mt-1"
                />
                <Label htmlFor="lgpd" className="text-xs leading-tight font-normal text-muted-foreground">
                  Concordo com o tratamento dos meus dados pessoais conforme a LGPD.
                </Label>
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : "Criar conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl gap-2"
          onClick={handleGoogle}
          disabled={submitting}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Auth;
