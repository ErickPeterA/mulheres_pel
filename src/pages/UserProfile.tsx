import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, MapPin, Clock, Tag, Gift, Briefcase, MessageCircle, Instagram, Image as ImageIcon, Hash, Pencil, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import ImageLightbox from "@/components/ImageLightbox";

const UserProfile = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_code", code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code && !!user,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["public-profile-photos", profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", profile!.user_id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <div className="p-4 text-center py-20">
          <p className="text-muted-foreground">Perfil não encontrado</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </MobileLayout>
    );
  }

  const isOwn = profile.user_id === user.id;
  const photo = profile.photo_url || profile.avatar_url;
  const displayName = profile.company_name || profile.full_name || "Membro";
  const whatsappUrl = profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` : null;
  const instagramUrl = profile.instagram ? `https://instagram.com/${profile.instagram.replace("@", "")}` : null;
  const images = photos.map((p) => ({ url: p.photo_url }));

  return (
    <MobileLayout>
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-foreground truncate flex-1">{displayName}</h1>
        {isOwn && (
          <button
            onClick={() => navigate("/meu-perfil")}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Editar perfil"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
        {/* Capa + Avatar (estilo LinkedIn) */}
        <div className="relative">
          <div className="w-full aspect-[3/1] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
            {(profile as any).cover_url && (
              <img src={(profile as any).cover_url} alt="Capa" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
            <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden ring-4 ring-background shadow-lg">
              {photo ? (
                <img src={photo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/40">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 pt-14 pb-4 flex flex-col items-center text-center">
          <h2 className="font-bold text-lg text-foreground">{displayName}</h2>
          {profile.full_name && profile.company_name && (
            <p className="text-sm text-muted-foreground">{profile.full_name}</p>
          )}
          {profile.segment && (
            <Badge className="mt-2 bg-primary text-primary-foreground border-0 text-xs font-semibold px-4 py-1">
              {profile.segment}
            </Badge>
          )}
          {profile.user_code && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              <Hash size={11} /> {profile.user_code}
            </span>
          )}

          {profile.specialties && profile.specialties.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {profile.specialties.map((s) => (
                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botões de contato */}
        {(whatsappUrl || instagramUrl) && (
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
        )}

        <div className="px-4 space-y-3">
          {profile.advantage && (
            <InfoSection icon={<Gift size={18} />} title="Vantagem Exclusiva" highlight>
              <p className="text-sm">{profile.advantage}</p>
            </InfoSection>
          )}
          {profile.services && profile.services.length > 0 && (
            <InfoSection icon={<Briefcase size={18} />} title="Serviços">
              <div className="flex flex-wrap gap-1.5">
                {profile.services.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground">{s}</span>
                ))}
              </div>
            </InfoSection>
          )}
          {profile.location && (
            <InfoSection icon={<MapPin size={18} />} title="Localização"><p className="text-sm">{profile.location}</p></InfoSection>
          )}
          {profile.working_hours && (
            <InfoSection icon={<Clock size={18} />} title="Horário"><p className="text-sm">{profile.working_hours}</p></InfoSection>
          )}
          {profile.description && (
            <InfoSection icon={<Tag size={18} />} title="Sobre"><p className="text-sm">{profile.description}</p></InfoSection>
          )}
        </div>

        {photos.length > 0 && (
          <div className="px-4 mt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <ImageIcon size={16} className="text-primary" /> Portfólio
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-xl overflow-hidden bg-secondary cursor-pointer"
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                >
                  <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <ImageLightbox images={images} initialIndex={lightboxIndex} open={lightboxOpen} onOpenChange={setLightboxOpen} />
          </div>
        )}
      </motion.div>
    </MobileLayout>
  );
};

const InfoSection = ({ icon, title, children, highlight }: { icon: React.ReactNode; title: string; children: React.ReactNode; highlight?: boolean }) => (
  <div className={`rounded-xl p-4 ${highlight ? "bg-primary/5 border border-primary/20" : "bg-card border border-border"}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <h3 className={`text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{title}</h3>
    </div>
    <div className="text-muted-foreground">{children}</div>
  </div>
);

export default UserProfile;
