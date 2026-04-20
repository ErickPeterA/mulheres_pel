import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

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

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_delete_user", { _target_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message ?? "Erro ao excluir usuário"),
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
      {users.map((u) => {
        const isSelf = currentUser?.id === u.user_id;
        return (
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
              {u.user_code && (
                <p className="text-[10px] text-muted-foreground font-mono">#{u.user_code}</p>
              )}
            </div>
            {u.isAdmin && (
              <Badge variant="secondary" className="text-[10px]">Admin</Badge>
            )}
            {!isSelf && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá permanentemente <strong>{u.email}</strong> e todos os seus dados (perfil, fotos, conta). Não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteUser.mutate(u.user_id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminUsers;
