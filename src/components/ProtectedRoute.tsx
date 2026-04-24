import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin = false }: Props) => {
  const { user, isAdmin, loading, approvalStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  // Bloqueia acesso de usuários não aprovados (exceto admins)
  if (!isAdmin && approvalStatus !== "approved") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
