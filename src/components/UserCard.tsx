import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin, Hash } from "lucide-react";

interface UserCardProps {
  user: {
    user_id: string;
    user_code: string | null;
    full_name: string | null;
    company_name: string | null;
    segment: string | null;
    photo_url: string | null;
    avatar_url: string | null;
    location: string | null;
    specialties: string[] | null;
  };
}

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate();
  const photo = user.photo_url || user.avatar_url;
  const displayName = user.company_name || user.full_name || "Membro";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => user.user_code && navigate(`/perfil/${user.user_code}`)}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
          {photo ? (
            <img src={photo} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/40">
              {initial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm truncate">{displayName}</h3>
          {user.full_name && user.company_name && (
            <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {user.segment && (
              <Badge className="bg-primary/10 text-primary border-0 text-[11px] font-semibold hover:bg-primary/20">
                {user.segment}
              </Badge>
            )}
            {user.user_code && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                <Hash size={10} /> {user.user_code}
              </span>
            )}
          </div>
          {user.location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
              <MapPin size={11} />
              <span className="text-[11px] truncate">{user.location}</span>
            </div>
          )}
        </div>
      </div>

      {user.specialties && user.specialties.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {user.specialties.slice(0, 4).map((spec) => (
            <span
              key={spec}
              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
            >
              {spec}
            </span>
          ))}
          {user.specialties.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{user.specialties.length - 4}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default UserCard;
