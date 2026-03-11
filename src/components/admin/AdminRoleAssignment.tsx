import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ShieldPlus, Loader2, Trash2, Shield } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  userName?: string;
}

export function AdminRoleAssignment() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("supporter");
  const { isMaster } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user IDs linked to active campaign (via profile or user_campanhas)
  const { data: campaignUserIds } = useQuery({
    queryKey: ['admin-campaign-users', activeCampanhaId],
    queryFn: async () => {
      if (!activeCampanhaId) return [];
      const ids = new Set<string>();
      // Users with profile.campanha_id = active
      const { data: profileUsers } = await supabase.from('profiles').select('id').eq('campanha_id', activeCampanhaId);
      profileUsers?.forEach(p => ids.add(p.id));
      // Users linked via user_campanhas
      const { data: ucUsers } = await supabase.from('user_campanhas').select('user_id').eq('campanha_id', activeCampanhaId);
      ucUsers?.forEach(uc => ids.add(uc.user_id));
      return Array.from(ids);
    },
    enabled: !!activeCampanhaId,
  });

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['admin-user-roles', activeCampanhaId],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, name');
      if (profilesError) throw profilesError;
      const profilesMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
      const allRoles = (roles?.map(role => ({ ...role, userName: profilesMap.get(role.user_id) || 'Usuário desconhecido' })) || []) as UserRole[];
      // Filter: master sees all, admin sees only roles of users in active campaign
      if (isMaster) return allRoles;
      if (!campaignUserIds?.length) return [];
      const userIdSet = new Set(campaignUserIds);
      return allRoles.filter(r => userIdSet.has(r.user_id));
    }
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-list', activeCampanhaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, name').order('name');
      if (error) throw error;
      if (!data) return [];
      // Filter: master sees all, admin sees only profiles in active campaign
      if (isMaster) return data;
      if (!campaignUserIds?.length) return [];
      const userIdSet = new Set(campaignUserIds);
      return data.filter(p => userIdSet.has(p.id));
    }
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Get old role for audit
      const { data: oldRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
      const oldRole = oldRoles?.[0]?.role || null;

      // Remove existing roles first (one role per user)
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;

      // Audit log
      await supabase.from('audit_log').insert({
        table_name: 'user_roles',
        action: oldRole ? 'UPDATE' : 'INSERT',
        record_id: userId,
        old_data: oldRole ? { role: oldRole } : null,
        new_data: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: "Função adicionada com sucesso" });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("supporter");
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar função", description: error.message, variant: "destructive" });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      // Get role data for audit before deleting
      const { data: roleData } = await supabase.from('user_roles').select('user_id, role').eq('id', roleId).single();

      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;

      // Audit log
      if (roleData) {
        await supabase.from('audit_log').insert({
          table_name: 'user_roles',
          action: 'DELETE',
          record_id: roleData.user_id,
          old_data: { role: roleData.role },
          new_data: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: "Função removida com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover função", description: error.message, variant: "destructive" });
    }
  });

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'master': case 'admin': return 'destructive';
      case 'candidate': case 'coordinator': case 'assessor': return 'default';
      case 'local_coordinator': case 'political_leader': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'master': return 'Master (Desenvolvedor)';
      case 'admin': return 'Administrador de Sistema';
      case 'candidate': return 'Candidato';
      case 'assessor': return 'Assessor';
      case 'coordinator': return 'Coordenador Geral';
      case 'local_coordinator': return 'Coordenador Local';
      case 'political_leader': return 'Liderança Política';
      case 'supervisor': return 'Supervisor de Área';
      default: return 'Apoiador';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Atribuir Função
          </CardTitle>
          <CardDescription>Gerencie as funções conforme a hierarquia do plano de campanha</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ShieldPlus className="w-4 h-4" />
              Atribuir Função
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Nova Função</DialogTitle>
              <DialogDescription>Selecione o nível hierárquico do membro</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Função (Papel)</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supporter">Apoiador</SelectItem>
                    <SelectItem value="political_leader">Liderança Política</SelectItem>
                    <SelectItem value="local_coordinator">Coordenador Local</SelectItem>
                    <SelectItem value="supervisor">Supervisor de Área</SelectItem>
                    <SelectItem value="coordinator">Coordenador Geral</SelectItem>
                    <SelectItem value="candidate">Candidato</SelectItem>
                    {isMaster && <SelectItem value="admin">Administrador de Sistema</SelectItem>}
                    {isMaster && <SelectItem value="master">Master (Desenvolvedor)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole })}
                disabled={!selectedUserId || addRoleMutation.isPending}
              >
                {addRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Papel no Sistema</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles?.map((ur) => (
              <TableRow key={ur.id}>
                <TableCell className="font-medium">{ur.userName}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(ur.role)}>{getRoleLabel(ur.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { if (confirm('Remover esta função?')) removeRoleMutation.mutate(ur.id); }}
                    disabled={removeRoleMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
