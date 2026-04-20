import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import EventCarousel from "@/components/EventCarousel";
import ProfessionalCard from "@/components/ProfessionalCard";
import UserCard from "@/components/UserCard";
import ScrollToTop from "@/components/ScrollToTop";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const { user, loading: authLoading } = useAuth();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("is_active", true)
        .order("company_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users-public"],
    queryFn: async () => {
      const [{ data: profilesData, error }, { data: adminRoles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, user_code, full_name, company_name, segment, photo_url, avatar_url, location, specialties, profile_completed")
          .eq("profile_completed", true)
          .not("user_code", "is", null)
          .order("company_name", { nullsFirst: false }),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);
      if (error) throw error;
      const adminIds = new Set((adminRoles ?? []).map((r) => r.user_id));
      return (profilesData ?? []).filter((p) => !adminIds.has(p.user_id));
    },
    enabled: !!user,
  });

  const filteredPros = useMemo(() => {
    if (!search.trim()) return professionals;
    const q = search.toLowerCase().trim();
    return professionals.filter(
      (p) =>
        p.segment.toLowerCase().includes(q) ||
        p.company_name.toLowerCase().includes(q) ||
        (p.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [professionals, search]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.user_code === q ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.company_name || "").toLowerCase().includes(q) ||
        (u.segment || "").toLowerCase().includes(q) ||
        (u.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [users, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const totalResults = filteredPros.length + filteredUsers.length;

  return (
    <MobileLayout>
      <Header />
      <SearchBar value={search} onChange={setSearch} />
      <EventCarousel />

      <div className="px-4 pb-6 space-y-5">
        {(isLoading || loadingUsers) ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              {search ? "Nada encontrado para sua busca" : "Nenhum cadastro disponível"}
            </p>
          </div>
        ) : (
          <>
            {filteredUsers.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Membros ({filteredUsers.length})
                </h2>
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <UserCard key={u.user_id} user={u} />
                  ))}
                </div>
              </section>
            )}

            {filteredPros.length > 0 && (
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
          </>
        )}
      </div>
      <ScrollToTop />
    </MobileLayout>
  );
};

export default Index;
