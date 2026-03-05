import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useIBGEMunicipios } from "@/hooks/useIBGEMunicipios";
import { z } from "zod";

const FUNCOES_POLITICAS = [
  "Prefeito(a)", "Vereador(a)", "Presidente de Bairro", "Líder Comunitário",
  "Coordenador(a) de Campanha", "Cabo Eleitoral", "Assessor(a) Político",
  "Militante", "Simpatizante", "Outros",
];

interface FormConfig {
  campanha_id: string;
  enabled: boolean;
  fields: Record<string, boolean>;
  titulo: string;
  mensagem_sucesso: string;
}

interface InviteData {
  campanha_id: string;
  campanha_nome?: string;
  campanha_logo?: string;
  campanha_cor?: string;
}

const supporterSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  endereco: z.string().trim().max(200).optional().or(z.literal("")),
  bairro: z.string().trim().max(100).optional().or(z.literal("")),
  cidade: z.string().trim().max(100).optional().or(z.literal("")),
  estado: z.string().trim().max(2).optional().or(z.literal("")),
  cep: z.string().trim().max(10).optional().or(z.literal("")),
  cpf: z.string().trim().max(14).optional().or(z.literal("")),
  funcao_politica: z.string().trim().max(100).optional().or(z.literal("")),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormData = z.infer<typeof supporterSchema>;

const initialForm: FormData = {
  nome: "", email: "", telefone: "", endereco: "", bairro: "",
  cidade: "", estado: "", cep: "", cpf: "", funcao_politica: "", observacao: "",
};

const FIELD_LABELS: Record<string, string> = {
  nome: "Nome Completo", telefone: "Telefone", email: "Email",
  cpf: "CPF", endereco: "Endereço", bairro: "Bairro",
  cidade: "Cidade", estado: "UF", cep: "CEP", funcao_politica: "Função Política",
  observacao: "Observação",
};

export default function ExternalRegister() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const ibge = useIBGEMunicipios();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const cidadeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        cidadeInputRef.current && !cidadeInputRef.current.contains(e.target as Node)
      ) {
        ibge.close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ibge.close]);

  const handleSelectMunicipio = (m: { id: number; nome: string; uf: string }) => {
    setForm(f => ({ ...f, cidade: m.nome, estado: m.uf }));
    ibge.setQuery(m.nome);
    ibge.close();
    if (formErrors.cidade) setFormErrors(prev => ({ ...prev, cidade: "" }));
    if (formErrors.estado) setFormErrors(prev => ({ ...prev, estado: "" }));
  };

  const handleCidadeChange = (value: string) => {
    handleChange("cidade", value);
    ibge.setQuery(value);
  };

  useEffect(() => {
    if (token) loadInviteAndConfig(token);
  }, [token]);

  const loadInviteAndConfig = async (t: string) => {
    try {
      const { data: inviteData, error: inviteErr } = await supabase
        .from("invite_links")
        .select("campanha_id")
        .eq("token", t)
        .is("used_at", null)
        .maybeSingle();

      if (inviteErr || !inviteData) {
        setError("Link inválido ou expirado.");
        setLoading(false);
        return;
      }

      const { data: campanha } = await supabase
        .from("campanhas")
        .select("nome, logo_url, cor_primaria")
        .eq("id", inviteData.campanha_id)
        .maybeSingle();

      setInvite({
        campanha_id: inviteData.campanha_id,
        campanha_nome: campanha?.nome,
        campanha_logo: campanha?.logo_url,
        campanha_cor: campanha?.cor_primaria,
      });

      const { data: configData } = await supabase
        .from("external_form_config")
        .select("*")
        .eq("campanha_id", inviteData.campanha_id)
        .eq("enabled", true)
        .maybeSingle();

      if (!configData) {
        setError("O formulário externo não está habilitado para esta campanha.");
        setLoading(false);
        return;
      }

      setConfig({
        campanha_id: configData.campanha_id,
        enabled: configData.enabled,
        fields: (configData.fields as Record<string, boolean>) || {},
        titulo: configData.titulo || "Cadastro de Apoiador",
        mensagem_sucesso: configData.mensagem_sucesso || "Cadastro realizado com sucesso!",
      });
    } catch {
      setError("Erro ao carregar formulário.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !config || !token) return;

    const result = supporterSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      const data = result.data;
      const { error: insertError } = await supabase.from("supporters").insert({
        campanha_id: invite.campanha_id,
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        cpf: data.cpf || null,
        funcao_politica: data.funcao_politica || null,
        endereco: data.endereco || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        observacao: data.observacao || null,
      });

      if (insertError) throw new Error(insertError.message);
      setSuccess(true);
    } catch (err: any) {
      setFormErrors({ _general: err.message || "Erro ao cadastrar." });
    } finally {
      setSaving(false);
    }
  };

  const isFieldVisible = (field: string) => {
    if (field === "nome") return true;
    return config?.fields?.[field] === true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-semibold">Link Inválido</h2>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <h2 className="text-lg font-semibold">Cadastro Realizado!</h2>
            <p className="text-muted-foreground text-center">{config?.mensagem_sucesso}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = invite?.campanha_cor || undefined;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Campaign branding */}
        <div className="flex flex-col items-center gap-3">
          {invite?.campanha_logo && (
            <img src={invite.campanha_logo} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
          )}
          {invite?.campanha_nome && (
            <h1 className="text-xl font-bold text-center" style={primaryColor ? { color: primaryColor } : undefined}>
              {invite.campanha_nome}
            </h1>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{config?.titulo || "Cadastro"}</CardTitle>
            <CardDescription>Preencha seus dados para se cadastrar como apoiador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors._general && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">{formErrors._general}</p>
              )}

              {/* Nome - always visible */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Seu nome completo" maxLength={100} />
                {formErrors.nome && <p className="text-sm text-destructive">{formErrors.nome}</p>}
              </div>

              {isFieldVisible("email") && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" maxLength={255} />
                  {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
                </div>
              )}

              {isFieldVisible("telefone") && (
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(00) 00000-0000" maxLength={20} />
                </div>
              )}

              {isFieldVisible("cpf") && (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={form.cpf} onChange={(e) => handleChange("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                </div>
              )}

              {isFieldVisible("funcao_politica") && (
                <div className="space-y-2">
                  <Label htmlFor="funcao_politica">Função Política</Label>
                  <Select value={form.funcao_politica} onValueChange={(v) => handleChange("funcao_politica", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {FUNCOES_POLITICAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isFieldVisible("observacao") && (
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea id="observacao" value={form.observacao} onChange={(e) => handleChange("observacao", e.target.value)} placeholder="Informações adicionais..." maxLength={500} rows={3} />
                </div>
              )}

              {isFieldVisible("endereco") && (
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={form.endereco} onChange={(e) => handleChange("endereco", e.target.value)} placeholder="Rua, número" maxLength={200} />
                </div>
              )}

              {(isFieldVisible("bairro") || isFieldVisible("cidade") || isFieldVisible("estado") || isFieldVisible("cep")) && (
                <div className="grid grid-cols-2 gap-4">
                  {isFieldVisible("bairro") && (
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} maxLength={100} />
                    </div>
                  )}
                  {isFieldVisible("cidade") && (
                    <div className="space-y-2 relative">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        ref={cidadeInputRef}
                        value={ibge.query || form.cidade}
                        onChange={(e) => handleCidadeChange(e.target.value)}
                        placeholder="Digite o nome da cidade"
                        autoComplete="off"
                        maxLength={100}
                      />
                      {ibge.isOpen && (
                        <div ref={suggestionsRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-52 overflow-y-auto">
                          {ibge.suggestions.map((s) => (
                            <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => handleSelectMunicipio(s)}>
                              {s.nome} <span className="text-muted-foreground">— {s.uf}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isFieldVisible("estado") && (
                    <div className="space-y-2">
                      <Label htmlFor="estado">UF</Label>
                      <Input id="estado" value={form.estado} readOnly className="bg-muted" placeholder="UF" maxLength={2} />
                    </div>
                  )}
                  {isFieldVisible("cep") && (
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" value={form.cep} onChange={(e) => handleChange("cep", e.target.value)} maxLength={10} />
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
                style={primaryColor ? { backgroundColor: primaryColor } : undefined}
              >
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cadastrando...</> : "Cadastrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Seus dados serão utilizados exclusivamente para fins de campanha eleitoral.
        </p>
      </div>
    </div>
  );
}
