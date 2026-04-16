import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Save, ChevronUp, ChevronDown } from "lucide-react";

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, event_images(*)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events-with-images"] });
      toast({ title: "Evento removido!" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = events.findIndex((e) => e.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= events.length) return;

      const a = events[idx];
      const b = events[swapIdx];

      await Promise.all([
        supabase.from("events").update({ display_order: swapIdx }).eq("id", a.id),
        supabase.from("events").update({ display_order: idx }).eq("id", b.id),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events-with-images"] });
    },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-full rounded-xl gap-2">
        <Plus size={16} /> Novo Evento
      </Button>

      {showForm && (
        <EventForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
            queryClient.invalidateQueries({ queryKey: ["events-with-images"] });
          }}
          nextOrder={events.length}
        />
      )}

      {events.map((ev, idx) => (
        <div key={ev.id} className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{ev.title}</p>
              <p className="text-xs text-muted-foreground">{ev.description}</p>
              <p className="text-xs text-primary mt-1">{(ev.event_images || []).length} imagens</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => reorderMutation.mutate({ id: ev.id, direction: "up" })}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => reorderMutation.mutate({ id: ev.id, direction: "down" })}
                disabled={idx === events.length - 1}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <button onClick={() => deleteMutation.mutate(ev.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
          {(ev.event_images || []).length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto">
              {(ev.event_images as any[]).sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => (
                <img key={img.id} src={img.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const EventForm = ({ onClose, onSaved, nextOrder }: { onClose: () => void; onSaved: () => void; nextOrder: number }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<FileList | null>(null);

  const handleSubmit = async () => {
    if (!title) {
      toast({ title: "Preencha o título", variant: "destructive" });
      return;
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({ title, description: description || null, display_order: nextOrder })
      .select()
      .single();
    if (error) { toast({ title: "Erro ao criar evento", variant: "destructive" }); return; }

    if (images) {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split(".").pop();
        const path = `${event.id}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("events").upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("events").getPublicUrl(path);
          await supabase.from("event_images").insert({
            event_id: event.id,
            image_url: urlData.publicUrl,
            display_order: i,
          });
        }
      }
    }

    toast({ title: "Evento criado!" });
    onSaved();
  };

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Novo Evento</h3>
        <button onClick={onClose}><X size={16} /></button>
      </div>
      <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
      <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Imagens do evento</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} className="text-xs" />
      </div>
      <Button onClick={handleSubmit} className="w-full rounded-xl gap-2">
        <Save size={16} /> Criar Evento
      </Button>
    </div>
  );
};

export default AdminEvents;
