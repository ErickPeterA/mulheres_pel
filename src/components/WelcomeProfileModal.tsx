import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

const nameSchema = z.string().trim().min(2, "Nome muito curto").max(100);
const phoneSchema = z.string().trim().max(20).optional().or(z.literal(""));

const WelcomeProfileModal = () => {
  const { user, profileCompleted, loading, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && !profileCompleted) {
      setOpen(true);
    }
  }, [loading, user, profileCompleted]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(fullName);
      phoneSchema.parse(phone);
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: "Erro", description: msg, variant: "destructive" });
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        profile_completed: true,
        lgpd_consent: true,
        lgpd_consent_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil salvo! Bem-vinda 💖" });
    await refreshProfile();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent dismiss */ }}>
      <DialogContent className="max-w-[90vw] rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="text-primary" size={24} />
          </div>
          <DialogTitle className="text-center">Bem-vinda!</DialogTitle>
          <DialogDescription className="text-center">
            Complete seu perfil para uma experiência personalizada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-name">Nome completo *</Label>
            <Input
              id="welcome-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome-phone">Telefone (opcional)</Label>
            <Input
              id="welcome-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
              placeholder="(53) 9XXXX-XXXX"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={16} /> : "Salvar e continuar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeProfileModal;
