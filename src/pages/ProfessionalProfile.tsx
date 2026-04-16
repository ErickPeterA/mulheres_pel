import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Tag,
  Gift,
  Briefcase,
  MessageCircle,
  Instagram,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";

const ProfessionalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: professional, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["professional-photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_photos")
        .select("*")
        .eq("professional_id", id!)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!professional) {
    return (
      <MobileLayout>
        <div className="p-4 text-center py-20">
          <p className="text-muted-foreground">Profissional não encontrado</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const whatsappUrl = professional.whatsapp
    ? `https://wa.me/${professional.whatsapp.replace(/\D/g, "")}`
    : null;
  const instagramUrl = professional.instagram
    ? `https://instagram.com/${professional.instagram.replace("@", "")}`
    : null;

  return (
    <MobileLayout>
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-foreground truncate">{professional.company_name}</h1>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-8"
      >
        {/* Profile hero */}
        <div className="px-4 pt-5 pb-4 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-secondary overflow-hidden mb-3 shadow-lg">
            {professional.photo_url || professional.logo_url ? (
              <img
                src={professional.photo_url || professional.logo_url || ""}
                alt={professional.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/40">
                {professional.company_name.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="font-bold text-lg text-foreground">{professional.company_name}</h2>
          {professional.owner_name && (
            <p className="text-sm text-muted-foreground">{professional.owner_name}</p>
          )}
          <Badge className="mt-2 bg-primary text-primary-foreground border-0 text-xs font-semibold px-4 py-1">
            {professional.segment}
          </Badge>

          {professional.specialties && professional.specialties.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {professional.specialties.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Contact buttons */}
        <div className="px-4 flex gap-3 mb-5">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white rounded-xl h-11 gap-2">
                <MessageCircle size={18} /> WhatsApp
              </Button>
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl h-11 gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Instagram size={18} /> Instagram
              </Button>
            </a>
          )}
        </div>

        {/* Info sections */}
        <div className="px-4 space-y-3">
          {professional.advantage && (
            <InfoSection icon={<Gift size={18} />} title="Vantagem Exclusiva" highlight>
              <p className="text-sm">{professional.advantage}</p>
            </InfoSection>
          )}

          {professional.services && professional.services.length > 0 && (
            <InfoSection icon={<Briefcase size={18} />} title="Serviços">
              <div className="flex flex-wrap gap-1.5">
                {professional.services.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </InfoSection>
          )}

          {professional.location && (
            <InfoSection icon={<MapPin size={18} />} title="Localização">
              <p className="text-sm">{professional.location}</p>
            </InfoSection>
          )}

          {professional.working_hours && (
            <InfoSection icon={<Clock size={18} />} title="Horário de Funcionamento">
              <p className="text-sm">{professional.working_hours}</p>
            </InfoSection>
          )}

          {professional.description && (
            <InfoSection icon={<Tag size={18} />} title="Sobre">
              <p className="text-sm">{professional.description}</p>
            </InfoSection>
          )}
        </div>

        {/* Portfolio */}
        {photos.length > 0 && (
          <PortfolioGallery photos={photos} />
        )}
      </motion.div>
    </MobileLayout>
  );
};

interface InfoSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}

const InfoSection = ({ icon, title, children, highlight }: InfoSectionProps) => (
  <div
    className={`rounded-xl p-4 ${
      highlight
        ? "bg-primary/5 border border-primary/20"
        : "bg-card border border-border"
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <h3 className={`text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>
        {title}
      </h3>
    </div>
    <div className="text-muted-foreground">{children}</div>
  </div>
);

export default ProfessionalProfile;
