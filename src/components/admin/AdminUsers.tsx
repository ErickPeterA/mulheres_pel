import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User as UserIcon } from "lucide-react";

const AdminUsers = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      return (profiles ?? []).map((p) => ({ ...p, isAdmin: adminIds.has(p.user_id) }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserIcon className="mx-auto mb-2 opacity-50" size={32} />
        <p className="text-sm">Nenhum usuário cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{users.length} usuário(s) registrado(s)</p>
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={u.avatar_url ?? undefined} alt={u.full_name ?? u.email} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{u.full_name ?? "Sem nome"}</p>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
          {u.isAdmin && (
            <Badge variant="secondary" className="text-[10px]">Admin</Badge>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminUsers;
