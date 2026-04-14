import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, X, Save, Image } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

const AdminProfessionals = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast({ title: "Profissional removido!" });
    },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-full rounded-xl gap-2">
        <Plus size={16} /> Novo Profissional
      </Button>

      {showForm && (
        <ProfessionalForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["professionals"] });
          }}
        />
      )}

      {professionals.map((p) =>
        editing === p.id ? (
          <ProfessionalForm
            key={p.id}
            professional={p}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              queryClient.invalidateQueries({ queryKey: ["professionals"] });
            }}
          />
        ) : (
          <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{p.company_name}</p>
              <p className="text-xs text-primary font-medium">{p.segment}</p>
              <p className="text-xs text-muted-foreground">{p.owner_name}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => setEditing(p.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent">
                <Edit2 size={14} />
              </button>
              <button onClick={() => deleteMutation.mutate(p.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 text-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

interface ProfessionalFormProps {
  professional?: Tables<"professionals">;
  onClose: () => void;
  onSaved: () => void;
}

const ProfessionalForm = ({ professional, onClose, onSaved }: ProfessionalFormProps) => {
  const [form, setForm] = useState({
    company_name: professional?.company_name || "",
    owner_name: professional?.owner_name || "",
    segment: professional?.segment || "",
    specialties: (professional?.specialties || []).join(", "),
    services: (professional?.services || []).join(", "),
    description: professional?.description || "",
    location: professional?.location || "",
    advantage: professional?.advantage || "",
    working_hours: professional?.working_hours || "",
    whatsapp: professional?.whatsapp || "",
    instagram: professional?.instagram || "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<FileList | null>(null);

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.company_name || !form.segment) {
      toast({ title: "Preencha nome e segmento", variant: "destructive" });
      return;
    }

    let photo_url = professional?.photo_url || null;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `photos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("professionals").upload(path, photoFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("professionals").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const payload = {
      company_name: form.company_name,
      owner_name: form.owner_name || null,
      segment: form.segment,
      specialties: form.specialties ? form.specialties.split(",").map((s) => s.trim()).filter(Boolean) : [],
      services: form.services ? form.services.split(",").map((s) => s.trim()).filter(Boolean) : [],
      description: form.description || null,
      location: form.location || null,
      advantage: form.advantage || null,
      working_hours: form.working_hours || null,
      whatsapp: form.whatsapp || null,
      instagram: form.instagram || null,
      photo_url,
    };

    let professionalId = professional?.id;

    if (professional) {
      const { error } = await supabase.from("professionals").update(payload).eq("id", professional.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
    } else {
      const { data, error } = await supabase.from("professionals").insert(payload).select().single();
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      professionalId = data.id;
    }

    // Upload portfolio photos
    if (portfolioFiles && professionalId) {
      for (let i = 0; i < portfolioFiles.length; i++) {
        const file = portfolioFiles[i];
        const ext = file.name.split(".").pop();
        const path = `portfolio/${professionalId}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("professionals").upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("professionals").getPublicUrl(path);
          await supabase.from("professional_photos").insert({
            professional_id: professionalId,
            photo_url: urlData.publicUrl,
            display_order: i,
          });
        }
      }
    }

    toast({ title: professional ? "Atualizado!" : "Profissional criado!" });
    onSaved();
  };

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{professional ? "Editar" : "Novo"} Profissional</h3>
        <button onClick={onClose}><X size={16} /></button>
      </div>

      <Input placeholder="Nome da empresa *" value={form.company_name} onChange={(e) => handleChange("company_name", e.target.value)} className="rounded-xl" />
      <Input placeholder="Nome do proprietário" value={form.owner_name} onChange={(e) => handleChange("owner_name", e.target.value)} className="rounded-xl" />
      <Input placeholder="Segmento *" value={form.segment} onChange={(e) => handleChange("segment", e.target.value)} className="rounded-xl" />
      <Input placeholder="Especialidades (separadas por vírgula)" value={form.specialties} onChange={(e) => handleChange("specialties", e.target.value)} className="rounded-xl" />
      <Input placeholder="Serviços (separados por vírgula)" value={form.services} onChange={(e) => handleChange("services", e.target.value)} className="rounded-xl" />
      <Textarea placeholder="Descrição" value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="rounded-xl" />
      <Input placeholder="Localização" value={form.location} onChange={(e) => handleChange("location", e.target.value)} className="rounded-xl" />
      <Input placeholder="Vantagem / Promoção *" value={form.advantage} onChange={(e) => handleChange("advantage", e.target.value)} className="rounded-xl" />
      <Input placeholder="Horário de funcionamento" value={form.working_hours} onChange={(e) => handleChange("working_hours", e.target.value)} className="rounded-xl" />
      <Input placeholder="WhatsApp (ex: 5553981847352)" value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} className="rounded-xl" />
      <Input placeholder="Instagram (ex: @ do usuario)" value={form.instagram} onChange={(e) => handleChange("instagram", e.target.value)} className="rounded-xl" />

      <div>
        <label className="text-xs text-muted-foreground block mb-2">Foto de Perfil</label>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="text-xs" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Portfólio (múltiplas fotos)</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setPortfolioFiles(e.target.files)} className="text-xs" />
      </div>

      <Button onClick={handleSubmit} className="w-full rounded-xl gap-2">
        <Save size={16} /> {professional ? "Salvar" : "Criar"}
      </Button>
    </div>
  );
};

export default AdminProfessionals;
