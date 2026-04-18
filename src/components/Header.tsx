import { Bell, LogIn, LogOut, Shield, User, UserCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NotificationsPanel from "./NotificationsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo_def.jpeg" alt="" className="w-[4.1rem]" />
          <span className="font-bold text-[0.799rem] text-lg">Mulheres Empreendedoras Pelotas</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-accent"
            aria-label="Notificações"
          >
            <Bell size={20} className="text-secondary-foreground" />
            <NotificationBadge />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-accent" aria-label="Conta">
                <User size={20} className="text-secondary-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/meu-perfil")}>
                  <UserCircle size={14} className="mr-2" /> Meu Perfil
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield size={14} className="mr-2" /> Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut size={14} className="mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-accent"
              aria-label="Entrar"
            >
              <LogIn size={20} className="text-secondary-foreground" />
            </button>
          )}
        </div>
      </header>

      <NotificationsPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

const NotificationBadge = () => {
  return (
    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
      !
    </span>
  );
};

export default Header;
