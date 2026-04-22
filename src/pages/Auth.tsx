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

      </div>
    </MobileLayout>
  );
};

export default Auth;
