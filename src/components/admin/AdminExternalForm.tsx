import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Link2, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FIELD_OPTIONS = [
  { key: "nome", label: "Nome Completo", locked: true },
  { key: "telefone", label: "Telefone" },
  { key: "email", label: "Email" },
  { key: "cpf", label: "CPF" },
  { key: "funcao_politica", label: "Função Política" },
  { key: "endereco", label: "Endereço" },
  { key: "bairro", label: "Bairro" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "UF" },
  { key: "cep", label: "CEP" },
  { key: "foto", label: "Foto" },
  { key: "observacao", label: "Observação" },
];

const BASE_URL = "https://www.gerencialcampanha.com.br";

export function AdminExternalForm() {
  const { user } = useAuth();
  const effectiveCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expiresInDays, setExpiresInDays] = useState("7");

  // --- Form config ---
  const { data: config, isLoading } = useQuery({
    queryKey: ["external-form-config", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return null;
      const { data } = await supabase
        .from("external_form_config")
        .select("*")
        .eq("campanha_id", effectiveCampanhaId)
        .maybeSingle();
      return data;
    },
    enabled: !!effectiveCampanhaId,
  });

  // --- Invite links ---
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

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [fields, setFields] = useState<Record<string, boolean> | null>(null);
  const [titulo, setTitulo] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const currentEnabled = enabled ?? config?.enabled ?? false;
  const currentFields = fields ?? (config?.fields as Record<string, boolean>) ?? { nome: true, telefone: true, email: true };
  const currentTitulo = titulo ?? config?.titulo ?? "Cadastro de Apoiador";
  const currentMensagem = mensagemSucesso ?? config?.mensagem_sucesso ?? "Cadastro realizado com sucesso!";

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveCampanhaId) throw new Error("Sem campanha");
      const payload = {
        campanha_id: effectiveCampanhaId,
        enabled: currentEnabled,
        fields: currentFields,
        titulo: currentTitulo,
        mensagem_sucesso: currentMensagem,
        updated_at: new Date().toISOString(),
      };
      if (config?.id) {
        const { error } = await supabase.from("external_form_config").update(payload as any).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("external_form_config").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-form-config"] });
      toast({ title: "Configuração salva!" });
      setEnabled(null); setFields(null); setTitulo(null); setMensagemSucesso(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
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
      toast({ title: "Link de convite criado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar link", description: err.message, variant: "destructive" });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.from("invite_links").delete().eq("token", token);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invite-links"] });
      toast({ title: "Link excluído com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    },
  });

  const toggleField = (key: string) => {
    const updated = { ...currentFields, [key]: !currentFields[key] };
    setFields(updated);
  };

  const copyLink = (token: string, type: "convite" | "cadastro") => {
    const url = `${BASE_URL}/${type}/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Form config */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário Externo de Cadastro</CardTitle>
          <CardDescription>Configure o formulário público que será acessado via link de convite</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Formulário habilitado</Label>
              <p className="text-sm text-muted-foreground">Permite que pessoas se cadastrem pelo link</p>
            </div>
            <Switch checked={currentEnabled} onCheckedChange={(v) => setEnabled(v)} />
          </div>

          <div className="space-y-2">
            <Label>Título do formulário</Label>
            <Input value={currentTitulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Cadastro de Apoiador" maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label>Mensagem de sucesso</Label>
            <Input value={currentMensagem} onChange={(e) => setMensagemSucesso(e.target.value)} placeholder="Cadastro realizado com sucesso!" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label className="text-base">Campos visíveis</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {FIELD_OPTIONS.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">{f.label}</span>
                  {f.locked ? (
                    <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                  ) : (
                    <Switch checked={currentFields[f.key] ?? false} onCheckedChange={() => toggleField(f.key)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Links de Convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Links de Convite
          </CardTitle>
          <CardDescription>Crie links para convidar novos usuários ou para o formulário externo de cadastro</CardDescription>
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
                              <Badge className="bg-green-600 text-white">Ativo</Badge>
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir link?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Este link será removido permanentemente e não poderá mais ser utilizado.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteLinkMutation.mutate(link.token)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
