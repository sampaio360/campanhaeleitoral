import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Trash2, RefreshCw, Copy, Eye, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  name: string;
  email?: string;
  pin?: string;
  candidate_id: string | null;
  campanha_id: string | null;
  created_at: string;
  roles: AppRole[];
  candidateName?: string;
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function AdminUsers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPin, setNewUserPin] = useState(generatePin());
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { isMaster } = useAuth();
  const queryClient = useQueryClient();

  const { user: authUser } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();

  // No longer need to fetch all admin campaigns - we use activeCampanhaId directly

  // Fetch all user_campanhas for cross-reference (only for non-master)
  const { data: allUserCampanhas } = useQuery({
    queryKey: ['admin-all-user-campanhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_campanhas')
        .select('user_id, campanha_id');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = profiles?.map((profile: any) => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
      })) || [];

      return usersWithRoles;
    }
  });

  // Filter users: master sees all, admin sees only users from their campaigns
  // Filter users: master sees all, admin sees only users from active campaign
  const filteredUsers = (() => {
    if (!users) return [];
    if (isMaster) return users;
    if (!activeCampanhaId) return [];
    return users.filter(u => {
      if (u.campanha_id === activeCampanhaId) return true;
      if (allUserCampanhas?.some(uc => uc.user_id === u.id && uc.campanha_id === activeCampanhaId)) return true;
      return false;
    });
  })();

  const { data: campanhas } = useQuery({
    queryKey: ['admin-campanhas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas')
        .select('id, nome')
        .is('deleted_at', null)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; name: string; password: string; pin: string }) => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Usuário excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir usuário", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPassword("");
    setNewUserPin(generatePin());
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast({ title: "PIN copiado!" });
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'master': return 'destructive';
      case 'admin': return 'destructive';
      case 'candidate': return 'default';
      case 'coordinator': return 'default';
      case 'local_coordinator': return 'outline';
      case 'political_leader': return 'outline';
      case 'supervisor': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'master': return 'Master (Desenvolvedor)';
      case 'admin': return 'Administrador de Sistema';
      case 'candidate': return 'Candidato';
      case 'coordinator': return 'Coordenador Geral';
      case 'local_coordinator': return 'Coordenador Local';
      case 'political_leader': return 'Liderança Política';
      case 'supervisor': return 'Supervisor de Área';
      default: return 'Apoiador';
    }
  };

  if (loadingUsers) {
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
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Gerencie os usuários do sistema</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados e gere um PIN de acesso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha (mín. 6 caracteres)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>PIN de Acesso (4 dígitos)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newUserPin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewUserPin(v);
                    }}
                    maxLength={4}
                    className="font-mono text-lg tracking-widest text-center"
                    placeholder="0000"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewUserPin(generatePin())}
                    title="Gerar novo PIN"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyPin(newUserPin)}
                    title="Copiar PIN"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Após criar o usuário, atribua a função e campanha nas abas "Permissões" e "Acesso".
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createUserMutation.mutate({
                  email: newUserEmail,
                  name: newUserName,
                  password: newUserPassword,
                  pin: newUserPin,
                })}
                disabled={createUserMutation.isPending || !newUserEmail || !newUserName || newUserPassword.length < 6 || newUserPin.length !== 4}
              >
                {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Criado em</TableHead>
              {isMaster && <TableHead>Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                <TableCell>
                  {(() => {
                    // Collect all campaign IDs for this user
                    const campIds = new Set<string>();
                    if (user.campanha_id) campIds.add(user.campanha_id);
                    allUserCampanhas?.filter(uc => uc.user_id === user.id).forEach(uc => campIds.add(uc.campanha_id));
                    
                    if (campIds.size === 0) return <span className="text-muted-foreground">—</span>;
                    
                    // Only show campaigns that exist in the active list
                    const resolved = Array.from(campIds)
                      .map(cid => ({ id: cid, nome: campanhas?.find(c => c.id === cid)?.nome }))
                      .filter(c => !!c.nome);
                    
                    if (resolved.length === 0) return <span className="text-muted-foreground">—</span>;
                    
                    return (
                      <div className="flex gap-1 flex-wrap">
                        {resolved.map(c => (
                          <Badge key={c.id} variant="outline">
                            {c.nome}
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {user.pin ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono">
                        {showPins[user.id] ? user.pin : '••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowPins(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                      >
                        {showPins[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyPin(user.pin!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {getRoleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                {isMaster && (
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{user.name}</strong>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum usuário encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
