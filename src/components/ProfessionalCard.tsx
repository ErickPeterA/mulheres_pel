import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface ProfessionalCardProps {
  professional: Tables<"professionals">;
}

const ProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/professional/${professional.id}`)}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
          {professional.photo_url ? (
            <img
              src={professional.photo_url}
              alt={professional.company_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/40">
              {professional.company_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm truncate">
            {professional.company_name}
          </h3>
          {professional.owner_name && (
            <p className="text-xs text-muted-foreground truncate">{professional.owner_name}</p>
          )}
          <Badge className="mt-1.5 bg-primary/10 text-primary border-0 text-[11px] font-semibold hover:bg-primary/20">
            {professional.segment}
          </Badge>
          {professional.location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
              <MapPin size={11} />
              <span className="text-[11px] truncate">{professional.location}</span>
            </div>
          )}
        </div>
      </div>

      {professional.specialties && professional.specialties.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {professional.specialties.slice(0, 4).map((spec) => (
            <span
              key={spec}
              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
            >
              {spec}
            </span>
          ))}
          {professional.specialties.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{professional.specialties.length - 4}
            </span>
          )}
        </div>
      )}

      {professional.description && (
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{professional.description}</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProfessionalCard;
