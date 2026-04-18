import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Hash, Copy, Check, Upload, X, Eye, Plus } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100),
  company_name: z.string().trim().max(120).optional().or(z.literal("")),
  segment: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  working_hours: z.string().trim().max(200).optional().or(z.literal("")),
  advantage: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const MyProfile = () => {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    segment: "",
    description: "",
    location: "",
    whatsapp: "",
    instagram: "",
    working_hours: "",
    advantage: "",
    phone: "",
    specialties: [] as string[],
    services: [] as string[],
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newService, setNewService] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: photos = [], refetch: refetchPhotos } = useQuery({
    queryKey: ["my-photos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", user!.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
        segment: profile.segment || "",
        description: profile.description || "",
        location: profile.location || "",
        whatsapp: profile.whatsapp || "",
        instagram: profile.instagram || "",
        working_hours: profile.working_hours || "",
        advantage: profile.advantage || "",
        phone: profile.phone || "",
        specialties: profile.specialties || [],
        services: profile.services || [],
      });
      setPhotoUrl(profile.photo_url || profile.avatar_url || null);
      setUserCode(profile.user_code || "");
    }
  }, [profile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/profile-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("user-photos").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(path);
    setPhotoUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Foto carregada!" });
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) continue;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("user-photos").upload(path, file);
      if (upErr) continue;
      const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(path);
      await supabase.from("user_photos").insert({
        user_id: user.id,
        photo_url: urlData.publicUrl,
        display_order: photos.length,
      });
    }
    setUploading(false);
    refetchPhotos();
    toast({ title: "Fotos adicionadas!" });
  };

  const removePhoto = async (id: string) => {
    await supabase.from("user_photos").delete().eq("id", id);
    refetchPhotos();
  };

  const addTag = (field: "specialties" | "services", value: string, setter: (v: string) => void) => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [field]: [...f[field], v] }));
    setter("");
  };

  const removeTag = (field: "specialties" | "services", idx: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      profileSchema.parse(form);
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: "Erro de validação", description: msg, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim() || null,
        segment: form.segment.trim() || null,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        instagram: form.instagram.trim() || null,
        working_hours: form.working_hours.trim() || null,
        advantage: form.advantage.trim() || null,
        phone: form.phone.trim() || null,
        specialties: form.specialties,
        services: form.services,
        photo_url: photoUrl,
        profile_completed: true,
        lgpd_consent: true,
        lgpd_consent_at: profile?.lgpd_consent_at || new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil salvo!" });
    await refreshProfile();
    queryClient.invalidateQueries({ queryKey: ["users-public"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  };

  if (authLoading || isLoading) {
    return (
      <MobileLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-foreground truncate">Meu Perfil</h1>
        </div>
        {userCode && (
          <button
            onClick={() => navigate(`/perfil/${userCode}`)}
            className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <Eye size={14} /> Ver público
          </button>
        )}
      </div>

      <div className="p-4 space-y-5 pb-10">
        {/* Código único */}
        {userCode && (
          <button
            onClick={handleCopy}
            className="w-full bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
          >
            <Hash className="text-primary" size={20} />
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seu código</p>
              <p className="font-mono font-bold text-xl tracking-widest text-primary">{userCode}</p>
            </div>
            {copied ? <Check size={16} className="text-primary ml-auto" /> : <Copy size={16} className="text-muted-foreground ml-auto" />}
          </button>
        )}

        {/* Foto principal */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-secondary overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/40">
                {form.full_name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            <span className="text-xs text-primary hover:underline flex items-center gap-1">
              <Upload size={12} /> {uploading ? "Enviando..." : "Trocar foto"}
            </span>
          </label>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <Field label="Nome completo *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Nome da empresa" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
          <Field label="Segmento" value={form.segment} onChange={(v) => setForm({ ...form, segment: v })} placeholder="Ex: Beleza, Moda, Gastronomia..." />
          <TextArea label="Sobre / Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Field label="Vantagem exclusiva" value={form.advantage} onChange={(v) => setForm({ ...form, advantage: v })} placeholder="Benefício para membros" />
          <Field label="Localização" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="Horário de funcionamento" value={form.working_hours} onChange={(v) => setForm({ ...form, working_hours: v })} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="(53) 9XXXX-XXXX" />
          <Field label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} placeholder="@seuusuario" />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

          {/* Especialidades */}
          <TagEditor
            label="Especialidades"
            tags={form.specialties}
            value={newSpecialty}
            onValueChange={setNewSpecialty}
            onAdd={() => addTag("specialties", newSpecialty, setNewSpecialty)}
            onRemove={(i) => removeTag("specialties", i)}
          />

          {/* Serviços */}
          <TagEditor
            label="Serviços"
            tags={form.services}
            value={newService}
            onValueChange={setNewService}
            onAdd={() => addTag("services", newService, setNewService)}
            onRemove={(i) => removeTag("services", i)}
          />
        </div>

        {/* Portfólio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Portfólio ({photos.length})</Label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} disabled={uploading} />
              <span className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar fotos
              </span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-secondary group">
                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={submitting} className="w-full rounded-xl h-12">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : "Salvar perfil"}
        </Button>
      </div>
    </MobileLayout>
  );
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
  </div>
);

const TextArea = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="rounded-xl resize-none" />
  </div>
);

const TagEditor = ({
  label, tags, value, onValueChange, onAdd, onRemove,
}: {
  label: string; tags: string[]; value: string; onValueChange: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        placeholder="Digite e Enter"
        className="rounded-xl"
      />
      <Button type="button" variant="outline" size="icon" onClick={onAdd} className="rounded-xl flex-shrink-0">
        <Plus size={16} />
      </Button>
    </div>
    {tags.length > 0 && (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
            {t}
            <button onClick={() => onRemove(i)} className="hover:text-destructive" aria-label="Remover">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

export default MyProfile;
