import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/lib/geocode";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";

const FUNCOES_POLITICAS = [
  "Prefeito(a)",
  "Vereador(a)",
  "Presidente de Bairro",
  "Líder Comunitário",
  "Coordenador(a) de Campanha",
  "Cabo Eleitoral",
  "Assessor(a) Político",
  "Militante",
  "Simpatizante",
  "Outros",
];

// --- Masks ---
function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

// --- Validation ---
function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

const supporterSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  endereco: z.string().trim().max(200).optional().or(z.literal("")),
  bairro: z.string().trim().max(100).optional().or(z.literal("")),
  cidade: z.string().trim().max(100).optional().or(z.literal("")),
  estado: z.string().trim().max(2).optional().or(z.literal("")),
  cep: z.string().trim().max(10).optional().or(z.literal("")),
  cpf: z.string().trim().max(14).optional().or(z.literal("")).refine(
    (val) => !val || val.replace(/\D/g, "").length === 0 || isValidCPF(val),
    { message: "CPF inválido" }
  ),
  funcao_politica: z.string().trim().max(100).optional().or(z.literal("")),
  observacao: z.string().trim().max(2000).optional().or(z.literal("")),
});

type SupporterFormData = z.infer<typeof supporterSchema>;

interface SupporterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const initialForm: SupporterFormData = {
  nome: "",
  telefone: "",
  email: "",
  endereco: "",
  bairro: "",
  cidade: "Barreiras",
  estado: "BA",
  cep: "",
  cpf: "",
  funcao_politica: "",
  observacao: "",
};

export function SupporterForm({ onSuccess, onCancel }: SupporterFormProps) {
  const { campanhaId, isMaster, selectedCampanhaId } = useAuth();
  const effectiveCampanhaId = isMaster ? (selectedCampanhaId || campanhaId) : campanhaId;
  const { toast } = useToast();
  const [form, setForm] = useState<SupporterFormData>(initialForm);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof SupporterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleMaskedChange = (field: keyof SupporterFormData, value: string, maskFn: (v: string) => string) => {
    handleChange(field, maskFn(value));
  };

  // --- CEP Lookup (ViaCEP) ---
  const lookupCEP = useCallback(async () => {
    const cepDigits = form.cep?.replace(/\D/g, "") || "";
    if (cepDigits.length !== 8) {
      toast({ title: "CEP inválido", description: "Informe um CEP com 8 dígitos.", variant: "destructive" });
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP informado.", variant: "destructive" });
        return;
      }
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      toast({ title: "Endereço preenchido", description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Erro ao buscar CEP", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  }, [form.cep, toast]);

  const handleCepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupCEP();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = supporterSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!effectiveCampanhaId) {
      toast({ title: "Erro", description: "Selecione uma campanha no menu do usuário.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const data = result.data;

      // Geocode address automatically
      const coords = await geocodeAddress({
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
      });

      // Build insert payload with PostGIS geolocation
      const insertPayload: Record<string, any> = {
        campanha_id: effectiveCampanhaId,
        nome: data.nome,
        telefone: data.telefone || null,
        email: data.email || null,
        endereco: data.endereco || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep?.replace(/\D/g, "") || null,
        cpf: data.cpf?.replace(/\D/g, "") || null,
        foto_url: fotoUrl,
        funcao_politica: data.funcao_politica || null,
        observacao: data.observacao || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      };

      // Send PostGIS POINT if coords available
      if (coords) {
        insertPayload.geolocation = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
      }

      const { error } = await supabase.from("supporters").insert(insertPayload as any);

      if (error) throw error;

      toast({ title: "Pessoa cadastrada!", description: `${data.nome} foi adicionado(a) com sucesso.` });
      setForm(initialForm);
      setFotoUrl(null);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Cadastrar Nova Pessoa</CardTitle>
        <CardDescription>Preencha os dados para registrar na campanha</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentUrl={fotoUrl}
              fallback={form.nome ? form.nome.charAt(0).toUpperCase() : "A"}
              onUploaded={setFotoUrl}
              folder="supporters"
              size="md"
            />
            <div>
              <p className="text-sm font-medium">Foto do Apoiador</p>
              <p className="text-xs text-muted-foreground">Clique no ícone da câmera para adicionar</p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Nome do apoiador"
              maxLength={100}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>

          {/* Telefone + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => handleMaskedChange("telefone", e.target.value, maskPhone)}
                placeholder="(77) 99999-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
                maxLength={255}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>

          {/* Função Política */}
          <div className="space-y-2">
            <Label htmlFor="funcao_politica">Função Política</Label>
            <Select
              value={form.funcao_politica}
              onValueChange={(value) => handleChange("funcao_politica", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função política" />
              </SelectTrigger>
              <SelectContent>
                {FUNCOES_POLITICAS.map((funcao) => (
                  <SelectItem key={funcao} value={funcao}>
                    {funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={form.cpf}
              onChange={(e) => handleMaskedChange("cpf", e.target.value, maskCPF)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
          </div>

          {/* CEP com busca */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={form.cep}
                onChange={(e) => handleMaskedChange("cep", e.target.value, maskCEP)}
                onKeyDown={handleCepKeyDown}
                placeholder="47800-000"
                maxLength={9}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={lookupCEP}
                disabled={cepLoading}
                title="Buscar CEP"
              >
                {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Digite o CEP e clique na lupa para preencher o endereço automaticamente</p>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={form.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
              placeholder="Rua, número, complemento"
              maxLength={200}
            />
          </div>

          {/* Bairro + Cidade + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={form.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                placeholder="Bairro"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                placeholder="Cidade"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF</Label>
              <Input
                id="estado"
                value={form.estado}
                onChange={(e) => handleChange("estado", e.target.value.toUpperCase())}
                placeholder="BA"
                maxLength={2}
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação / Histórico</Label>
            <Textarea
              id="observacao"
              value={form.observacao}
              onChange={(e) => handleChange("observacao", e.target.value)}
              placeholder="Anotações, histórico ou observações sobre esta pessoa..."
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} variant="campaign">
              {saving ? "Salvando..." : "Cadastrar Apoiador"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
