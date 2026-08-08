import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, User as UserIcon, Check, X, Clock, Hash, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [pwTarget, setPwTarget] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handleSetPassword = async () => {
    if (!pwTarget) return;
    if (newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    setSavingPw(true);
    const { data, error } = await supabase.functions.invoke("admin-set-password", {
      body: { targetUserId: pwTarget.userId, newPassword },
    });
    setSavingPw(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Erro ao redefinir senha");
      return;
    }
    toast.success(`Senha de ${pwTarget.email} redefinida`);
    setPwTarget(null);
    setNewPassword("");
  };


  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_list_users");
      if (error) throw error;
      return ((data ?? []) as any[]).map((p) => ({ ...p, isAdmin: p.is_admin }));
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado`);
  };

  const setStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "approved" | "rejected" | "pending" }) => {
      const { error } = await (supabase as any).rpc("admin_set_user_status", {
        _target_user_id: userId,
        _status: status,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      const label = vars.status === "approved" ? "aprovado" : vars.status === "rejected" ? "rejeitado" : "marcado como pendente";
      toast.success(`Usuário ${label}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["users-public"] });
    },
    onError: (err: Error) => toast.error(err.message ?? "Erro ao atualizar status"),
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

  const filtered = users.filter((u) => {
    if (filter === "all") return true;
    return u.approval_status === filter;
  });

  const counts = {
    pending: users.filter((u) => u.approval_status === "pending").length,
    approved: users.filter((u) => u.approval_status === "approved").length,
    rejected: users.filter((u) => u.approval_status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
        <TabsList className="w-full grid grid-cols-4 bg-secondary rounded-xl h-9">
          <TabsTrigger value="pending" className="rounded-lg text-[11px]">
            Pendentes {counts.pending > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[9px]">{counts.pending}</span>}
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg text-[11px]">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg text-[11px]">Rejeitados</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-[11px]">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserIcon className="mx-auto mb-2 opacity-50" size={32} />
          <p className="text-sm">Nenhum usuário nesta categoria.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} usuário(s)</p>
          {filtered.map((u) => {
            const isSelf = currentUser?.id === u.user_id;
            const status = u.approval_status as "pending" | "approved" | "rejected";
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
                    <button
                      onClick={() => copyCode(u.user_code)}
                      className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                      title="Copiar código"
                    >
                      <Hash size={9} />
                      {u.user_code}
                      <Copy size={9} />
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {u.isAdmin && <Badge variant="secondary" className="text-[9px] py-0">Admin</Badge>}
                    {!u.isAdmin && status === "pending" && (
                      <Badge variant="outline" className="text-[9px] py-0 border-primary/40 text-primary"><Clock size={9} className="mr-0.5" />Pendente</Badge>
                    )}
                    {!u.isAdmin && status === "approved" && (
                      <Badge className="text-[9px] py-0 bg-primary text-primary-foreground hover:bg-primary border-0">Aprovado</Badge>
                    )}
                    {!u.isAdmin && status === "rejected" && (
                      <Badge className="text-[9px] py-0 bg-destructive/15 text-destructive hover:bg-destructive/20 border-0">Rejeitado</Badge>
                    )}
                  </div>
                </div>

                {!u.isAdmin && !isSelf && (
                  <div className="flex flex-col gap-1">
                    {status !== "approved" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => setStatus.mutate({ userId: u.user_id, status: "approved" })}
                        title="Aprovar"
                      >
                        <Check size={14} />
                      </Button>
                    )}
                    {status !== "rejected" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setStatus.mutate({ userId: u.user_id, status: "rejected" })}
                        title="Rejeitar"
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                )}

                {!isSelf && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação removerá permanentemente <strong>{u.email}</strong> e todos os seus dados. Não pode ser desfeita.
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
        </>
      )}
    </div>
  );
};

export default AdminUsers;
