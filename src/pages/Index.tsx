import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import EventCarousel from "@/components/EventCarousel";
import ProfessionalCard from "@/components/ProfessionalCard";
import ScrollToTop from "@/components/ScrollToTop";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [search, setSearch] = useState("");

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
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return professionals;
    const q = search.toLowerCase();
    return professionals.filter(
      (p) =>
        p.segment.toLowerCase().includes(q) ||
        p.company_name.toLowerCase().includes(q) ||
        (p.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [professionals, search]);

  return (
    <MobileLayout>
      <Header />
      <SearchBar value={search} onChange={setSearch} />
      <EventCarousel />

      <div className="px-4 pb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Profissionais {filtered.length > 0 && `(${filtered.length})`}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              {search ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pro) => (
              <ProfessionalCard key={pro.id} professional={pro} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Index;
