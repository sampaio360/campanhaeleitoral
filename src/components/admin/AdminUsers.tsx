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
import { Database } from "@/integrations/supabase/types";

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
  const [newUserRole, setNewUserRole] = useState<AppRole>("supporter");
  const [newUserCampanha, setNewUserCampanha] = useState<string>("");
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (userData: { email: string; name: string; password: string; pin: string; role: AppRole; campanha_id?: string }) => {
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

  const resetForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPassword("");
    setNewUserPin(generatePin());
    setNewUserRole("supporter");
    setNewUserCampanha("");
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
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supporter">Apoiador</SelectItem>
                    <SelectItem value="supervisor">Supervisor de Área</SelectItem>
                    <SelectItem value="coordinator">Coordenador Geral</SelectItem>
                    <SelectItem value="candidate">Candidato</SelectItem>
                    <SelectItem value="admin">Administrador de Sistema</SelectItem>
                    <SelectItem value="master">Master (Desenvolvedor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campanha</Label>
                <Select value={newUserCampanha} onValueChange={setNewUserCampanha}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem campanha</SelectItem>
                    {campanhas?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  role: newUserRole,
                  campanha_id: newUserCampanha && newUserCampanha !== "none" ? newUserCampanha : undefined
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
              <TableHead>PIN</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum usuário encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
