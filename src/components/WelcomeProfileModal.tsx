import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Hash, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WelcomeProfileModal = () => {
  const { user, profileCompleted, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (loading || !user || profileCompleted) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_code")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserCode(data?.user_code ?? null);
      setOpen(true);
    };
    check();
  }, [loading, user, profileCompleted]);

  const handleCopy = () => {
    if (!userCode) return;
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    setOpen(false);
    navigate("/meu-perfil");
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent dismiss */ }}>
      <DialogContent className="max-w-[90vw] rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="text-primary" size={24} />
          </div>
          <DialogTitle className="text-center">Bem-vinda! 💖</DialogTitle>
          <DialogDescription className="text-center">
            Esse é o seu código único na plataforma. Outras pessoas podem te encontrar buscando por ele.
          </DialogDescription>
        </DialogHeader>

        {userCode && (
          <div className="my-2">
            <button
              onClick={handleCopy}
              className="w-full bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl py-4 px-4 flex items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
            >
              <Hash className="text-primary" size={22} />
              <span className="font-mono font-bold text-2xl tracking-widest text-primary">
                {userCode}
              </span>
              {copied ? (
                <Check size={18} className="text-primary" />
              ) : (
                <Copy size={18} className="text-muted-foreground" />
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Toque para copiar
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Agora vamos completar o seu perfil para que outras pessoas possam te conhecer.
          </p>
          <Button onClick={handleContinue} className="w-full rounded-xl">
            Completar meu perfil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeProfileModal;
