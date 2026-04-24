import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, LogOut, Loader2 } from "lucide-react";

const PendingApproval = () => {
  const { user, loading, isAdmin, approvalStatus, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  // Já aprovado ou admin: manda pra home
  if (isAdmin || approvalStatus === "approved") return <Navigate to="/" replace />;

  const rejected = approvalStatus === "rejected";

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${rejected ? "bg-destructive/10" : "bg-primary/10"}`}>
          {rejected ? (
            <ShieldAlert className="text-destructive" size={36} />
          ) : (
            <Clock className="text-primary" size={36} />
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {rejected ? "Cadastro não aprovado" : "Cadastro em análise"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-8">
          {rejected
            ? "Seu cadastro foi recusado pelo administrador. Entre em contato para mais informações."
            : "Seu cadastro foi realizado. Aguarde a aprovação do administrador para acessar a plataforma."}
        </p>
        <Button onClick={signOut} variant="outline" className="rounded-xl gap-2">
          <LogOut size={16} /> Sair
        </Button>
      </div>
    </MobileLayout>
  );
};

export default PendingApproval;
