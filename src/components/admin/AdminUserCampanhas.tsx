import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, Save, Crown, Plus, Copy, Trash2, Shield } from "lucide-react";

export function AdminUserCampanhas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { campanhaId, isMaster, selectedCampanhaId, user } = useAuth();
  const effectiveCampanhaId = isMaster ? (selectedCampanhaId || campanhaId) : campanhaId;
  const [pendingChanges, setPendingChanges] = useState<Record<string, string | null>>({});
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [addAdminCampanha, setAddAdminCampanha] = useState<Record<string, string>>({});

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-user-campanhas"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, campanha_id")
        .order("name");
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const { data: userCampanhas } = await supabase
        .from("user_campanhas")
        .select("user_id, campanha_id, id");

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const userCampanhasMap = new Map<string, { campanha_id: string; id: string }[]>();
      userCampanhas?.forEach((uc) => {
        const existing = userCampanhasMap.get(uc.user_id) || [];
        existing.push({ campanha_id: uc.campanha_id, id: uc.id });
        userCampanhasMap.set(uc.user_id, existing);
      });

      return profiles?.map((p) => ({
        ...p,
        roles: rolesMap.get(p.id) || [],
        isMaster: rolesMap.get(p.id)?.includes("master") || false,
        isAdmin: rolesMap.get(p.id)?.includes("admin") || false,
        userCampanhas: userCampanhasMap.get(p.id) || [],
      }));
    },
  });

  const { data: campanhas } = useQuery({
    queryKey: ["admin-campanhas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("id, nome, partido")
        .is("deleted_at", null)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Update profile campanha_id (for non-admin users)
  const updateMutation = useMutation({
    mutationFn: async ({ userId, campanhaId }: { userId: string; campanhaId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ campanha_id: campanhaId })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-campanhas"] });
      toast({ title: "Campanha atualizada!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Add campanha to admin user (user_campanhas)
  const addAdminCampanhaMutation = useMutation({
    mutationFn: async ({ userId, campanhaId }: { userId: string; campanhaId: string }) => {
      const { error } = await supabase
        .from("user_campanhas")
        .insert({ user_id: userId, campanha_id: campanhaId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-campanhas"] });
      toast({ title: "Campanha adicionada ao administrador!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Remove campanha from admin user (user_campanhas)
  const removeAdminCampanhaMutation = useMutation({
    mutationFn: async (ucId: string) => {
      const { error } = await supabase
        .from("user_campanhas")
        .delete()
        .eq("id", ucId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-campanhas"] });
      toast({ title: "Campanha removida do administrador!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Invite links
  const { data: inviteLinks, isLoading: loadingLinks } = useQuery({
    queryKey: ["admin-invite-links", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data, error } = await supabase
        .from("invite_links")
        .select("id, token, created_at, expires_at, used_at, used_by")
        .eq("campanha_id", effectiveCampanhaId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCampanhaId,
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveCampanhaId || !user) throw new Error("Sem campanha ou usuário");
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const days = parseInt(expiresInDays);
      const expires_at = days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;
      const { error } = await supabase.from("invite_links").insert({
        campanha_id: effectiveCampanhaId,
        created_by: user.id,
        token,
        expires_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invite-links"] });
      queryClient.invalidateQueries({ queryKey: ["invite-links-for-form"] });
      toast({ title: "Link de convite criado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar link", description: err.message, variant: "destructive" });
    },
  });

  const campanhasMap = new Map(campanhas?.map((c) => [c.id, c]) || []);

  const handleChange = (userId: string, value: string) => {
    const campanhaId = value === "__none__" ? null : value;
    setPendingChanges((prev) => ({ ...prev, [userId]: campanhaId }));
  };

  const handleSave = (userId: string) => {
    const campanhaId = pendingChanges[userId];
    if (campanhaId === undefined) return;
    updateMutation.mutate({ userId, campanhaId });
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleAddAdminCampanha = (userId: string) => {
    const campanhaId = addAdminCampanha[userId];
    if (!campanhaId) return;
    addAdminCampanhaMutation.mutate({ userId, campanhaId });
    setAddAdminCampanha((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
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

  const BASE_URL = "https://www.gerencialcampanha.com.br";

  const copyLink = (token: string, type: "convite" | "cadastro") => {
    const url = `${BASE_URL}/${type}/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  // Separate admin users from regular users
  const adminUsers = users?.filter((u) => u.isAdmin && !u.isMaster) || [];
  const regularUsers = users?.filter((u) => !u.isAdmin && !u.isMaster) || [];
  const masterUsers = users?.filter((u) => u.isMaster) || [];

  return (
    <div className="space-y-6">
      {/* Admin users - multi-campaign via user_campanhas */}
      {adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Administradores de Sistema
            </CardTitle>
            <CardDescription>Administradores podem gerenciar múltiplas campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminUsers.map((u) => {
                const assignedCampanhaIds = u.userCampanhas.map((uc) => uc.campanha_id);
                const availableCampanhas = campanhas?.filter((c) => !assignedCampanhaIds.includes(c.id)) || [];

                return (
                  <div key={u.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name}</span>
                      <Badge variant="destructive" className="text-xs">Admin</Badge>
                    </div>
                    
                    {/* Current campaigns */}
                    <div className="flex flex-wrap gap-2">
                      {u.userCampanhas.length === 0 && (
                        <span className="text-sm text-destructive font-medium">Sem campanhas vinculadas</span>
                      )}
                      {u.userCampanhas.map((uc) => {
                        const camp = campanhasMap.get(uc.campanha_id);
                        return (
                          <Badge key={uc.id} variant="secondary" className="gap-1">
                            {camp ? `${camp.nome}${camp.partido ? ` (${camp.partido})` : ""}` : uc.campanha_id}
                            {isMaster && (
                              <button
                                onClick={() => removeAdminCampanhaMutation.mutate(uc.id)}
                                className="ml-1 hover:text-destructive"
                                title="Remover campanha"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Add campaign - only master can manage admin campaigns */}
                    {isMaster && availableCampanhas.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={addAdminCampanha[u.id] || ""}
                          onValueChange={(v) => setAddAdminCampanha((prev) => ({ ...prev, [u.id]: v }))}
                        >
                          <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Adicionar campanha..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCampanhas.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome} {c.partido && `(${c.partido})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleAddAdminCampanha(u.id)}
                          disabled={!addAdminCampanha[u.id] || addAdminCampanhaMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master users */}
      {masterUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Desenvolvedores (Master)
            </CardTitle>
            <CardDescription>Possuem acesso global a todas as campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masterUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.name}
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Crown className="w-3 h-3" />
                          Master
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm italic">Acesso global</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Regular users - single campaign via profiles.campanha_id */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Acesso a Campanhas — Demais Usuários
          </CardTitle>
          <CardDescription>Defina a campanha associada a cada usuário</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Campanha atual</TableHead>
                <TableHead>Alterar para</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularUsers.map((u) => {
                const current = u.campanha_id ? campanhasMap.get(u.campanha_id) : null;
                const hasPending = pendingChanges[u.id] !== undefined;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {current ? (
                        <Badge variant="secondary">
                          {current.nome} {current.partido && `(${current.partido})`}
                        </Badge>
                      ) : (
                        <span className="text-destructive text-sm font-medium">Sem vínculo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={pendingChanges[u.id] ?? u.campanha_id ?? "__none__"}
                        onValueChange={(v) => handleChange(u.id, v)}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhuma</SelectItem>
                          {campanhas?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome} {c.partido && `(${c.partido})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {hasPending && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(u.id)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {regularUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Links de Convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Links de Convite
          </CardTitle>
          <CardDescription>
            Crie links para convidar novos usuários ou para o formulário externo de cadastro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!effectiveCampanhaId ? (
            <p className="text-sm text-muted-foreground">Selecione uma campanha primeiro.</p>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label>Expiração (dias)</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="0">Sem expiração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending}>
                  {createInviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Plus className="w-4 h-4 mr-1" />
                  Gerar Link
                </Button>
              </div>

              {loadingLinks ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : inviteLinks && inviteLinks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteLinks.map((link) => {
                      const isUsed = !!link.used_at;
                      const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                      return (
                        <TableRow key={link.id}>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{link.token}</code>
                          </TableCell>
                          <TableCell>
                            {isUsed ? (
                              <Badge variant="secondary">Usado</Badge>
                            ) : isExpired ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : (
                              <Badge className="bg-green-600">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {link.expires_at
                              ? new Date(link.expires_at).toLocaleDateString("pt-BR")
                              : "Nunca"}
                          </TableCell>
                          <TableCell>
                            {!isUsed && !isExpired && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" title="Copiar link de convite (criar conta)" onClick={() => copyLink(link.token, "convite")}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Copiar link de cadastro externo" onClick={() => copyLink(link.token, "cadastro")}>
                                  <Link2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum link criado ainda.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}