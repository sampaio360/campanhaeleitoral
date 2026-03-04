import { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/lib/geocode";
import { useIBGEMunicipios } from "@/hooks/useIBGEMunicipios";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { z } from "zod";
import { Loader2, Search, User, MapPin } from "lucide-react";

const FUNCOES_POLITICAS = [
  "Prefeito(a)", "Vereador(a)", "Presidente de Bairro", "Líder Comunitário",
  "Coordenador(a) de Campanha", "Cabo Eleitoral", "Assessor(a) Político",
  "Militante", "Simpatizante", "Outros",
];

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

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
  rua: z.string().trim().max(200).optional().or(z.literal("")),
  numero: z.string().trim().max(20).optional().or(z.literal("")),
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

export interface SupporterEditData {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  cpf?: string | null;
  funcao_politica?: string | null;
  observacao?: string | null;
  foto_url?: string | null;
}

interface SupporterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: SupporterEditData | null;
}

const initialForm: SupporterFormData = {
  nome: "", telefone: "", email: "", rua: "", numero: "", bairro: "",
  cidade: "", estado: "", cep: "", cpf: "", funcao_politica: "", observacao: "",
};

export function SupporterForm({ onSuccess, onCancel, editData }: SupporterFormProps) {
  const effectiveCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const isEditing = !!editData;

  const buildInitialForm = (): SupporterFormData => {
    if (!editData) return initialForm;
    const parts = (editData.endereco || "").split(",").map(s => s.trim());
    return {
      nome: editData.nome || "",
      telefone: editData.telefone ? maskPhone(editData.telefone) : "",
      email: editData.email || "",
      rua: parts[0] || "",
      numero: parts[1] || "",
      bairro: editData.bairro || "",
      cidade: editData.cidade || "",
      estado: editData.estado || "",
      cep: editData.cep ? maskCEP(editData.cep) : "",
      cpf: editData.cpf ? maskCPF(editData.cpf) : "",
      funcao_politica: editData.funcao_politica || "",
      observacao: editData.observacao || "",
    };
  };

  const [form, setForm] = useState<SupporterFormData>(buildInitialForm);
  const [fotoUrl, setFotoUrl] = useState<string | null>(editData?.foto_url ?? null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // IBGE autocomplete for cidade
  const ibge = useIBGEMunicipios();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const cidadeInputRef = useRef<HTMLInputElement>(null);

  // Google Places autocomplete for rua — biased by selected city
  const enderecoInputRef = useRef<HTMLInputElement>(null);
  const { ready: placesReady, setOnSelect } = useGooglePlaces(enderecoInputRef, true, {
    cityBias: form.cidade,
  });

  useEffect(() => {
    if (placesReady) {
      setOnSelect((place) => {
        const parts = (place.nome || "").split(",").map(s => s.trim());
        const rua = parts[0] || "";
        const numero = parts[1] || "";
        setForm(f => ({
          ...f,
          rua: rua || f.rua,
          numero: numero || f.numero,
          bairro: place.bairro || f.bairro,
          cidade: place.cidade || f.cidade,
          estado: place.estado || f.estado,
          cep: place.cep ? maskCEP(place.cep) : f.cep,
        }));
        if (place.cidade) ibge.setQuery(place.cidade);
      });
    }
  }, [placesReady, setOnSelect]);

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
  };

  const handleChange = (field: keyof SupporterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleMaskedChange = (field: keyof SupporterFormData, value: string, maskFn: (v: string) => string) => {
    handleChange(field, maskFn(value));
  };

  const handleCidadeChange = (value: string) => {
    handleChange("cidade", value);
    ibge.setQuery(value);
  };

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
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }
      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      ibge.setQuery(data.localidade || "");
      toast({ title: "Endereço preenchido" });
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  }, [form.cep, toast]);

  const handleCepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); lookupCEP(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = supporterSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0] as string] = issue.message; });
      setErrors(fieldErrors);
      return;
    }
    if (!effectiveCampanhaId) {
      toast({ title: "Erro", description: "Selecione uma campanha.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = result.data;
      const enderecoCompleto = [data.rua, data.numero].filter(Boolean).join(", ");
      const coords = await geocodeAddress({ endereco: enderecoCompleto, bairro: data.bairro, cidade: data.cidade, estado: data.estado, cep: data.cep });
      const payload: Record<string, any> = {
        campanha_id: effectiveCampanhaId, nome: data.nome,
        telefone: data.telefone || null, email: data.email || null,
        endereco: enderecoCompleto || null, bairro: data.bairro || null,
        cidade: data.cidade || null, estado: data.estado || null,
        cep: data.cep?.replace(/\D/g, "") || null, cpf: data.cpf?.replace(/\D/g, "") || null,
        foto_url: fotoUrl, funcao_politica: data.funcao_politica || null,
        observacao: data.observacao || null,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
      };
      if (coords) payload.geolocation = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;

      if (isEditing && editData) {
        const { error } = await supabase.from("supporters").update(payload as any).eq("id", editData.id);
        if (error) throw error;
        toast({ title: "Pessoa atualizada!", description: `${data.nome} atualizado(a) com sucesso.` });
      } else {
        const { error } = await supabase.from("supporters").insert(payload as any);
        if (error) throw error;
        toast({ title: "Pessoa cadastrada!", description: `${data.nome} adicionado(a) com sucesso.` });
      }
      setForm(initialForm);
      setFotoUrl(null);
      ibge.setQuery("");
      onSuccess();
    } catch (err: any) {
      toast({ title: isEditing ? "Erro ao atualizar" : "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Pessoa" : "Cadastrar Nova Pessoa"}</CardTitle>
        <CardDescription>{isEditing ? "Altere os dados e salve" : "Preencha os dados para registrar na campanha"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── SEÇÃO: DADOS PESSOAIS ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <User className="w-4 h-4" />
              Dados Pessoais
            </div>
            <Separator />

            {/* Foto + Nome */}
            <div className="flex items-start gap-4">
              <AvatarUpload currentUrl={fotoUrl} fallback={form.nome ? form.nome.charAt(0).toUpperCase() : "A"} onUploaded={setFotoUrl} folder="supporters" size="md" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Nome do apoiador" maxLength={100} />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
              </div>
            </div>

            {/* Telefone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={form.telefone} onChange={(e) => handleMaskedChange("telefone", e.target.value, maskPhone)} placeholder="(77) 99999-0000" maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" maxLength={255} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>

            {/* Função Política + CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="funcao_politica">Função Política</Label>
                <Select value={form.funcao_politica} onValueChange={(value) => handleChange("funcao_politica", value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a função política" /></SelectTrigger>
                  <SelectContent>
                    {FUNCOES_POLITICAS.map((funcao) => (<SelectItem key={funcao} value={funcao}>{funcao}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={form.cpf} onChange={(e) => handleMaskedChange("cpf", e.target.value, maskCPF)} placeholder="000.000.000-00" maxLength={14} />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
              </div>
            </div>
          </div>

          {/* ── SEÇÃO: ENDEREÇO ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              Endereço
            </div>
            <Separator />

            {/* Cidade (IBGE) + UF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 relative md:col-span-2">
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
                <p className="text-xs text-muted-foreground">Selecione a cidade para filtrar as sugestões de rua</p>
                {ibge.isOpen && (
                  <div ref={suggestionsRef} className="absolute z-50 top-[calc(100%-1.25rem)] left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-52 overflow-y-auto">
                    {ibge.suggestions.map((s) => (
                      <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => handleSelectMunicipio(s)}>
                        {s.nome} <span className="text-muted-foreground">— {s.uf}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">UF</Label>
                <Input id="estado" value={form.estado} readOnly className="bg-muted" placeholder="UF" maxLength={2} />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} placeholder="Bairro" maxLength={100} />
            </div>

            {/* Rua (Google Places) + Número */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="rua">
                  Rua / Logradouro
                  {!form.cidade && <span className="text-xs text-muted-foreground ml-1">(escolha a cidade primeiro)</span>}
                </Label>
                <Input
                  id="rua"
                  ref={enderecoInputRef}
                  value={form.rua}
                  onChange={(e) => handleChange("rua", e.target.value)}
                  placeholder={form.cidade ? "Digite a rua para sugestões" : "Aguardando cidade..."}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">Sugestões do Google Maps filtradas pela cidade</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={form.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="Nº"
                  maxLength={20}
                />
              </div>
            </div>

            {/* CEP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <div className="flex gap-2">
                  <Input id="cep" value={form.cep} onChange={(e) => handleMaskedChange("cep", e.target.value, maskCEP)} onKeyDown={handleCepKeyDown} placeholder="47800-000" maxLength={9} className="flex-1" />
                  <Button type="button" variant="outline" size="icon" onClick={lookupCEP} disabled={cepLoading || !form.cep} title="Buscar CEP">
                    {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SEÇÃO: OBSERVAÇÃO ── */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação / Histórico</Label>
            <Textarea id="observacao" value={form.observacao} onChange={(e) => handleChange("observacao", e.target.value)} placeholder="Anotações sobre esta pessoa..." maxLength={2000} rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} variant="campaign">
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Pessoa"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
