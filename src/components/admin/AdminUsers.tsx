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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Loader2, Trash2, RefreshCw, Copy, Eye, EyeOff,
  Plus, X, Ban, ShieldCheck, UserCheck, Link2, Unlink, Search, Filter
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";

type AppRole = Database['public']['Enums']['app_role'];

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const ROLE_OPTIONS: { value: AppRole; label: string; masterOnly?: boolean }[] = [
  { value: "supporter", label: "Apoiador" },
  { value: "supervisor", label: "Supervisor de Área" },
  { value: "local_coordinator", label: "Coordenador Local" },
  { value: "territorial_coordinator", label: "Coordenador Territorial" },
  { value: "political_leader", label: "Liderança Política" },
  { value: "assessor", label: "Assessor" },
  { value: "coordinator", label: "Coordenador Geral" },
  { value: "candidate", label: "Candidato" },
  { value: "admin", label: "Administrador", masterOnly: true },
  { value: "master", label: "Master", masterOnly: true },
];

const getRoleBadgeVariant = (role: AppRole) => {
  switch (role) {
    case 'master': case 'admin': return 'destructive' as const;
    case 'candidate': case 'coordinator': case 'assessor': return 'default' as const;
    case 'territorial_coordinator': case 'local_coordinator': case 'political_leader': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const getRoleLabel = (role: AppRole) => {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
};

export function AdminUsers() {
  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("__all__");
  const [roleFilter, setRoleFilter] = useState("__all__");

  // Create user dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPin, setNewUserPin] = useState(generatePin());
  const [newUserRole, setNewUserRole] = useState<AppRole>("supporter");
  const [newUserCampanhaId, setNewUserCampanhaId] = useState<string>("");

  // Supporter linking dialog
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [supporterSearch, setSupporterSearch] = useState("");

  // Role add popover
  const [addingRoleUserId, setAddingRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("supporter");

  // Campaign change popover
  const [changingCampaignUserId, setChangingCampaignUserId] = useState<string | null>(null);

  // PIN visibility
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const { isMaster } = useAuth();
  const queryClient = useQueryClient();
  const activeCampanhaId = useActiveCampanhaId();

  // ── Data fetching ──────────────────────────────────────────────

  const { data: campanhas } = useQuery({
    queryKey: ['admin-campanhas-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campanhas').select('id, nome').is('deleted_at', null).order('nome');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: allUserCampanhas } = useQuery({
    queryKey: ['admin-all-user-campanhas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_campanhas').select('user_id, campanha_id, id');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
      if (rErr) throw rErr;

      // Fetch linked supporter names
      const supporterIds = profiles?.filter(p => p.supporter_id).map(p => p.supporter_id!) || [];
      let supportersMap: Record<string, string> = {};
      if (supporterIds.length > 0) {
        const { data: supporters } = await supabase.from('supporters').select('id, nome').in('id', supporterIds);
        supporters?.forEach(s => { supportersMap[s.id] = s.nome; });
      }

      return profiles?.map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        pin: profile.pin,
        campanha_id: profile.campanha_id,
        candidate_id: profile.candidate_id,
        supporter_id: profile.supporter_id,
        blocked_at: profile.blocked_at || null,
        created_at: profile.created_at,
        roles: roles?.filter(r => r.user_id === profile.id) || [],
        supporterName: profile.supporter_id ? supportersMap[profile.supporter_id] || null : null,
      })) || [];
    }
  });

  // Supporters for linking dialog
  const { data: supporters } = useQuery({
    queryKey: ['admin-supporters-for-link', linkingUserId],
    enabled: !!linkingUserId,
    queryFn: async () => {
      const user = users?.find(u => u.id === linkingUserId);
      let query = supabase.from('supporters').select('id, nome, telefone, bairro, cidade').order('nome');
      if (user?.campanha_id) query = query.eq('campanha_id', user.campanha_id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // ── Filter logic ──────────────────────────────────────────────

  const filteredUsers = (() => {
    if (!users) return [];
    let list = users;

    // Scope: non-master admins only see users from active campaign
    if (!isMaster) {
      if (!activeCampanhaId) return [];
      list = list.filter(u => {
        if (u.campanha_id === activeCampanhaId) return true;
        if (allUserCampanhas?.some(uc => uc.user_id === u.id && uc.campanha_id === activeCampanhaId)) return true;
        return false;
      });
    }

    // Name filter
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }

    // Campaign filter
    if (campaignFilter !== "__all__") {
      list = list.filter(u => {
        if (u.campanha_id === campaignFilter) return true;
        if (allUserCampanhas?.some(uc => uc.user_id === u.id && uc.campanha_id === campaignFilter)) return true;
        return false;
      });
    }

    // Role filter
    if (roleFilter !== "__all__") {
      list = list.filter(u => u.roles.some(r => r.role === roleFilter));
    }

    return list;
  })();

  // ── Mutations ──────────────────────────────────────────────────

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-all-user-campanhas'] });
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; name: string; password: string; pin: string; role: AppRole; campanha_id: string | null }) => {
      const { data, error } = await supabase.functions.invoke('create-user', { body: userData });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      setIsCreateOpen(false);
      resetCreateForm();
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', { body: { user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Usuário excluído!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const { data, error } = await supabase.functions.invoke('block-user', { body: { user_id: userId, block } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: (_, { block }) => {
      invalidateAll();
      toast({ title: block ? "Usuário bloqueado!" : "Usuário desbloqueado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const changeCampaignMutation = useMutation({
    mutationFn: async ({ userId, campanhaId }: { userId: string; campanhaId: string | null }) => {
      const { error } = await supabase.from('profiles').update({ campanha_id: campanhaId }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Campanha atualizada!" });
      setChangingCampaignUserId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Remove all existing roles for this user, then insert the new one (one role per user)
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId);
      if (existing && existing.length > 0) {
        const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
        if (delErr) throw delErr;
      }
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Função adicionada!" });
      setAddingRoleUserId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Função removida!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const linkSupporterMutation = useMutation({
    mutationFn: async ({ userId, supporterId }: { userId: string; supporterId: string | null }) => {
      const { error } = await supabase.from('profiles').update({ supporter_id: supporterId }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setLinkingUserId(null);
      toast({ title: "Vínculo atualizado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  // ── Helpers ────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPassword("");
    setNewUserPin(generatePin());
    setNewUserRole("supporter");
    setNewUserCampanhaId(activeCampanhaId || "");
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast({ title: "PIN copiado!" });
  };

  const getUserCampanhas = (userId: string, profileCampanhaId: string | null) => {
    const ids = new Set<string>();
    if (profileCampanhaId) ids.add(profileCampanhaId);
    allUserCampanhas?.filter(uc => uc.user_id === userId).forEach(uc => ids.add(uc.campanha_id));
    return Array.from(ids).map(id => campanhas?.find(c => c.id === id)).filter(Boolean) as { id: string; nome: string }[];
  };

  const filteredSupporters = supporters?.filter(s =>
    s.nome.toLowerCase().includes(supporterSearch.toLowerCase()) ||
    s.telefone?.includes(supporterSearch) ||
    s.bairro?.toLowerCase().includes(supporterSearch.toLowerCase()) ||
    s.cidade?.toLowerCase().includes(supporterSearch.toLowerCase())
  ) || [];

  // ── Render ─────────────────────────────────────────────────────

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
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gerencie usuários, funções, campanhas e vínculos</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (open) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário</DialogTitle>
                <DialogDescription>Preencha os dados e gere um PIN de acesso</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome completo" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="usuario@email.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (mín. 6 caracteres)</Label>
                  <Input id="password" type="password" placeholder="••••••" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>PIN de Acesso (4 dígitos)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="font-mono text-lg tracking-widest text-center"
                      placeholder="0000"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setNewUserPin(generatePin())} title="Gerar novo PIN">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => copyPin(newUserPin)} title="Copiar PIN">
                      <Copy className="w-4 h-4" />
                    </Button>
                   </div>
                </div>
                <div className="space-y-2">
                  <Label>Campanha</Label>
                  <Select value={newUserCampanhaId} onValueChange={setNewUserCampanhaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a campanha" />
                    </SelectTrigger>
                    <SelectContent>
                      {campanhas?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.filter(r => isMaster || !r.masterOnly).map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => createUserMutation.mutate({
                    email: newUserEmail,
                    name: newUserName,
                    password: newUserPassword,
                    pin: newUserPin,
                    role: newUserRole,
                    campanha_id: newUserCampanhaId || null,
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

        {/* ── Filtros ─────────────────────────────────────────── */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas campanhas</SelectItem>
                {campanhas?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas funções</SelectItem>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(nameFilter || campaignFilter !== "__all__" || roleFilter !== "__all__") && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{filteredUsers.length} resultado(s)</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setNameFilter(""); setCampaignFilter("__all__"); setRoleFilter("__all__"); }}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* ── Tabela ──────────────────────────────────────────── */}
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead>Pessoa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                {isMaster && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userCamps = getUserCampanhas(user.id, user.campanha_id);
                const isBlocked = !!user.blocked_at;

                return (
                  <TableRow key={user.id} className={isBlocked ? "opacity-60" : ""}>
                    {/* Nome + Email */}
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email || '—'}</p>
                      </div>
                    </TableCell>

                    {/* Campanha */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {userCamps.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {userCamps.map(c => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.nome}</Badge>
                        ))}
                        <Popover open={changingCampaignUserId === user.id} onOpenChange={(open) => setChangingCampaignUserId(open ? user.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Alterar campanha">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-3" align="start">
                            <p className="text-xs font-medium mb-2">Campanha principal</p>
                            <Select
                              value={user.campanha_id || "__none__"}
                              onValueChange={(v) => {
                                changeCampaignMutation.mutate({ userId: user.id, campanhaId: v === "__none__" ? null : v });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Nenhuma</SelectItem>
                                {campanhas?.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>

                    {/* PIN */}
                    <TableCell>
                      {user.pin ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">{showPins[user.id] ? user.pin : '••••'}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowPins(p => ({ ...p, [user.id]: !p[user.id] }))}>
                            {showPins[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyPin(user.pin!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : '—'}
                    </TableCell>

                    {/* Função (única) */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {user.roles.length > 0 && (
                          <Badge variant={getRoleBadgeVariant(user.roles[0].role)} className="gap-1 text-xs">
                            {getRoleLabel(user.roles[0].role)}
                            <button
                              onClick={() => { if (confirm(`Remover função "${getRoleLabel(user.roles[0].role)}"?`)) removeRoleMutation.mutate(user.roles[0].id); }}
                              className="ml-0.5 hover:text-destructive-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        )}
                        <Popover open={addingRoleUserId === user.id} onOpenChange={(open) => { setAddingRoleUserId(open ? user.id : null); setNewRole(user.roles[0]?.role || "supporter"); }}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title={user.roles.length > 0 ? "Alterar função" : "Atribuir função"}>
                              {user.roles.length > 0 ? <RefreshCw className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-3" align="start">
                            <p className="text-xs font-medium mb-2">{user.roles.length > 0 ? "Alterar função" : "Atribuir função"}</p>
                            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                              <SelectTrigger className="w-full mb-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.filter(r => !r.masterOnly || isMaster).map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => addRoleMutation.mutate({ userId: user.id, role: newRole })}
                              disabled={addRoleMutation.isPending}
                            >
                              {addRoleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>

                    {/* Pessoa vinculada */}
                    <TableCell>
                      {user.supporterName ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="default" className="gap-1 text-xs">
                            <UserCheck className="w-3 h-3" />
                            {user.supporterName}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={() => linkSupporterMutation.mutate({ userId: user.id, supporterId: null })}
                            title="Desvincular"
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs gap-1"
                          onClick={() => { setLinkingUserId(user.id); setSupporterSearch(""); }}
                        >
                          <Link2 className="w-3 h-3" />
                          Vincular
                        </Button>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isBlocked ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <Ban className="w-3 h-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <ShieldCheck className="w-3 h-3" />
                          Ativo
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
                        onClick={() => blockUserMutation.mutate({ userId: user.id, block: !isBlocked })}
                        disabled={blockUserMutation.isPending}
                        title={isBlocked ? "Desbloquear" : "Bloquear"}
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    </TableCell>

                    {/* Criado em */}
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>

                    {/* Ações */}
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
                );
              })}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog: Vincular Pessoa ───────────────────────────── */}
      <Dialog open={!!linkingUserId} onOpenChange={(open) => { if (!open) setLinkingUserId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular a Pessoa</DialogTitle>
            <DialogDescription>
              Busque pelo nome para vincular ao usuário{" "}
              <strong>{users?.find(u => u.id === linkingUserId)?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Command className="border rounded-md">
            <CommandInput placeholder="Buscar pelo nome..." value={supporterSearch} onValueChange={setSupporterSearch} />
            <CommandList>
              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
              <CommandGroup>
                {filteredSupporters.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.nome}
                    onSelect={() => linkSupporterMutation.mutate({ userId: linkingUserId!, supporterId: s.id })}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{s.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {[s.bairro, s.cidade].filter(Boolean).join(', ') || 'Sem localização'}
                        {s.telefone ? ` • ${s.telefone}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingUserId(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
