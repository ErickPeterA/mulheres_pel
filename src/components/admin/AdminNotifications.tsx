import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Save, Send } from "lucide-react";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Notificação removida!" });
    },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-full rounded-xl gap-2">
        <Plus size={16} /> Nova Notificação
      </Button>

      {showForm && (
        <NotificationForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        />
      )}

      {notifications.map((n) => (
        <div key={n.id} className="bg-card border border-border rounded-xl p-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(n.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button onClick={() => deleteMutation.mutate(n.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 text-destructive flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const NotificationForm = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!title || !message) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("notifications").insert({ title, message });
    if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }

    toast({ title: "Notificação enviada!" });
    onSaved();
  };

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Nova Notificação</h3>
        <button onClick={onClose}><X size={16} /></button>
      </div>
      <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
      <Textarea placeholder="Mensagem *" value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-xl" />
      <Button onClick={handleSubmit} className="w-full rounded-xl gap-2">
        <Send size={16} /> Enviar Notificação
      </Button>
    </div>
  );
};

export default AdminNotifications;
