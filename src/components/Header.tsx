import { Bell, User } from "lucide-react";
import { useState } from "react";
import NotificationsPanel from "./NotificationsPanel";

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/public/Logo_header.png" alt=""  className="w-11"/>
          <span className="font-bold text-foreground text-lg">Mulheres Empreendedoras</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-accent"
          >
            <Bell size={20} className="text-secondary-foreground" />
            <NotificationBadge />
          </button>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-accent">
            <User size={20} className="text-secondary-foreground" />
          </button>
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
