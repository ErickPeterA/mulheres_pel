import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import EventCarousel from "@/components/EventCarousel";
import ScrollToTop from "@/components/ScrollToTop";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["users-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, user_code, full_name, company_name, owner_name, segment, specialties, description, location, photo_url, avatar_url")
        .eq("profile_completed", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const filteredPros = useMemo(() => {
    if (!search.trim()) return professionals;
    const q = search.toLowerCase().trim();
    return professionals.filter(
      (p) =>
        (p.segment || "").toLowerCase().includes(q) ||
        (p.company_name || "").toLowerCase().includes(q) ||
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.user_code || "").toLowerCase().includes(q) ||
        (p.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [professionals, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <MobileLayout>
      <Header />
      <SearchBar value={search} onChange={setSearch} />
      <EventCarousel />

      <div className="px-4 pb-6 space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredPros.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              {search ? "Nada encontrado para sua busca" : "Nenhum profissional disponível"}
            </p>
          </div>
        ) : (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Profissionais ({filteredPros.length})
            </h2>
            <div className="space-y-3">
              {filteredPros.map((pro, idx) => (
                <motion.div
                  key={pro.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => pro.user_code && navigate(`/perfil/${pro.user_code}`)}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  {...(idx === 0 ? { "data-professional-card": true } : {})}
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                      {(pro.photo_url || pro.avatar_url) ? (
                        <img
                          src={pro.photo_url || pro.avatar_url || ""}
                          alt={pro.company_name || pro.full_name || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/40">
                          {(pro.company_name || pro.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">
                        {pro.company_name || pro.full_name}
                      </h3>
                      {pro.company_name && pro.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{pro.full_name}</p>
                      )}
                      {pro.segment && (
                        <Badge className="mt-1.5 bg-primary/10 text-primary border-0 text-[11px] font-semibold hover:bg-primary/20">
                          {pro.segment}
                        </Badge>
                      )}
                      {pro.location && (
                        <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                          <MapPin size={11} />
                          <span className="text-[11px] truncate">{pro.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {pro.specialties && pro.specialties.length > 0 && (
                    <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                      {pro.specialties.slice(0, 4).map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                      {pro.specialties.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          +{pro.specialties.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {pro.description && (
                    <div className="px-3 pb-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{pro.description}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
      <ScrollToTop />
    </MobileLayout>
  );
};

export default Index;
