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
                <div key={pro.id} {...(idx === 0 ? { "data-professional-card": true } : {})}>
                  <ProfessionalCard professional={pro} />
                </div>
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
