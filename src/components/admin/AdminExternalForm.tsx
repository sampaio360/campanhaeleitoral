import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
];

export function AdminExternalForm() {
  const { campanhaId, isMaster, selectedCampanhaId } = useAuth();
  const effectiveCampanhaId = isMaster ? (selectedCampanhaId || campanhaId) : campanhaId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: inviteLinks } = useQuery({
    queryKey: ["invite-links-for-form", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data } = await supabase
        .from("invite_links")
        .select("token, created_at, expires_at, used_at")
        .eq("campanha_id", effectiveCampanhaId)
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
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
        const { error } = await supabase
          .from("external_form_config")
          .update(payload as any)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("external_form_config")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-form-config"] });
      toast({ title: "Configuração salva!" });
      setEnabled(null);
      setFields(null);
      setTitulo(null);
      setMensagemSucesso(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const toggleField = (key: string) => {
    const updated = { ...currentFields, [key]: !currentFields[key] };
    setFields(updated);
  };

  const copyLink = (t: string) => {
    const url = `${window.location.origin}/cadastro/${t}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulário Externo de Cadastro</CardTitle>
          <CardDescription>
            Configure o formulário público que será acessado via link de convite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Formulário habilitado</Label>
              <p className="text-sm text-muted-foreground">Permite que pessoas se cadastrem pelo link</p>
            </div>
            <Switch checked={currentEnabled} onCheckedChange={(v) => setEnabled(v)} />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título do formulário</Label>
            <Input
              value={currentTitulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Cadastro de Apoiador"
              maxLength={100}
            />
          </div>

          {/* Success message */}
          <div className="space-y-2">
            <Label>Mensagem de sucesso</Label>
            <Input
              value={currentMensagem}
              onChange={(e) => setMensagemSucesso(e.target.value)}
              placeholder="Cadastro realizado com sucesso!"
              maxLength={200}
            />
          </div>

          {/* Field toggles */}
          <div className="space-y-2">
            <Label className="text-base">Campos visíveis</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {FIELD_OPTIONS.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">{f.label}</span>
                  {f.locked ? (
                    <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                  ) : (
                    <Switch
                      checked={currentFields[f.key] ?? false}
                      onCheckedChange={() => toggleField(f.key)}
                    />
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

      {/* Links */}
      {currentEnabled && inviteLinks && inviteLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links Disponíveis</CardTitle>
            <CardDescription>Use um link de convite existente para compartilhar o formulário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inviteLinks.map((link) => (
                <div key={link.token} className="flex items-center gap-2 text-sm">
                  <code className="flex-1 truncate bg-muted px-2 py-1 rounded text-xs">
                    {window.location.origin}/cadastro/{link.token}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyLink(link.token)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/cadastro/${link.token}`} target="_blank" rel="noopener">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
