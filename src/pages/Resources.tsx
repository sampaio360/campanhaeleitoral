import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { enqueueOffline } from "@/lib/offlineSync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, PlusCircle, CheckCircle, XCircle, Clock, Edit, ClipboardList, Boxes } from "lucide-react";
import { MaterialInventory } from "@/components/resources/MaterialInventory";


interface ResourceRequest {
  id: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  quantidade_utilizada: number;
  valor_estimado: number;
  localidade: string;
  bairro: string | null;
  cidade: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const TIPOS = [
  { value: "combustivel", label: "Combustível" },
  { value: "material", label: "Material" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "outros", label: "Outros" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700", icon: Clock },
  aprovado: { label: "Aprovado", color: "bg-green-500/10 text-green-700", icon: CheckCircle },
  recusado: { label: "Recusado", color: "bg-red-500/10 text-red-700", icon: XCircle },
  entregue: { label: "Entregue", color: "bg-blue-500/10 text-blue-700", icon: Package },
};

const Resources = () => {
  const { user, isAdmin, isMaster } = useAuth();
  const campanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("solicitacoes");
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    tipo: "",
    descricao: "",
    quantidade: "1",
    valor_estimado: "",
    localidade: "",
    bairro: "",
    cidade: "",
    notes: "",
  });

  // Usage dialog
  const [usageDialog, setUsageDialog] = useState<{ open: boolean; request: ResourceRequest | null }>({ open: false, request: null });
  const [usageAmount, setUsageAmount] = useState("");
  const [savingUsage, setSavingUsage] = useState(false);

  const { isLoading: loading } = useQuery({
    queryKey: ["resource-requests", campanhaId],
    queryFn: async () => {
      let query = supabase
        .from("resource_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (campanhaId) query = query.eq("campanha_id", campanhaId);
      const { data, error } = await query;
      if (error) throw error;
      const result = (data as ResourceRequest[]) || [];
      setRequests(result);
      return result;
    },
    enabled: !!user && (!!campanhaId || isMaster),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !campanhaId) return;
    setCreating(true);

    const { error } = await (supabase.from("resource_requests" as any) as any).insert({
      campanha_id: campanhaId,
      user_id: user.id,
      tipo: form.tipo,
      descricao: form.descricao,
      quantidade: parseFloat(form.quantidade),
      valor_estimado: parseFloat(form.valor_estimado),
      localidade: form.localidade,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      notes: form.notes || null,
    });

    if (error) {
      if (!navigator.onLine) {
        enqueueOffline("resource_requests", {
          campanha_id: campanhaId,
          user_id: user.id,
          tipo: form.tipo,
          descricao: form.descricao,
          quantidade: parseFloat(form.quantidade),
          valor_estimado: parseFloat(form.valor_estimado),
          localidade: form.localidade,
          bairro: form.bairro || null,
          cidade: form.cidade || null,
          notes: form.notes || null,
        });
        toast({ title: "Salvo offline", description: "Será sincronizado quando a conexão voltar." });
        setForm({ tipo: "", descricao: "", quantidade: "1", valor_estimado: "", localidade: "", bairro: "", cidade: "", notes: "" });
        setShowForm(false);
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Solicitação criada!" });
      setForm({ tipo: "", descricao: "", quantidade: "1", valor_estimado: "", localidade: "", bairro: "", cidade: "", notes: "" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    }
    setCreating(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase
      .from("resource_requests" as any)
      .update({ status: newStatus, aprovado_por: user?.id, aprovado_em: new Date().toISOString() })
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Status atualizado para ${STATUS_CONFIG[newStatus]?.label}` });
      queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    }
  };

  const handleSaveUsage = async () => {
    if (!usageDialog.request) return;
    setSavingUsage(true);
    const { error } = await (supabase
      .from("resource_requests" as any)
      .update({ quantidade_utilizada: parseFloat(usageAmount) })
      .eq("id", usageDialog.request.id) as any);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Uso registrado!" });
      setUsageDialog({ open: false, request: null });
      queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    }
    setSavingUsage(false);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
            <div className="flex items-center justify-between mb-4 pt-8">
              <div>
                <h1 className="text-3xl font-bold">Gestão de Recursos</h1>
                <p className="text-muted-foreground">Solicitação de insumos vinculados a localidades</p>
              </div>
              {activeTab === "solicitacoes" && (
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                  <PlusCircle className="w-4 h-4" /> Nova Solicitação
                </Button>
              )}
            </div>
            <TabsList>
              <TabsTrigger value="solicitacoes" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Solicitações
              </TabsTrigger>
              <TabsTrigger value="inventario" className="gap-2">
                <Boxes className="w-4 h-4" />
                Inventário
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="solicitacoes">
            {showForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Nova Solicitação de Recurso</CardTitle>
                  <CardDescription>O gasto será vinculado obrigatoriamente a uma localidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                          <SelectContent>
                            {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Localidade *</Label>
                        <Input value={form.localidade} onChange={(e) => setForm((p) => ({ ...p, localidade: e.target.value }))} placeholder="Rua / Local específico" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição *</Label>
                      <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o recurso necessário..." required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input type="number" value={form.quantidade} onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Estimado (R$)</Label>
                        <Input type="number" step="0.01" value={form.valor_estimado} onChange={(e) => setForm((p) => ({ ...p, valor_estimado: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input value={form.bairro} onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={form.cidade} onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas adicionais..." />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating || !form.tipo || !form.localidade}>
                        {creating ? "Criando..." : "Solicitar Recurso"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação</h3>
                    <p className="text-muted-foreground mb-4">Crie a primeira solicitação de recurso</p>
                    <Button onClick={() => setShowForm(true)}>Nova Solicitação</Button>
                  </CardContent>
                </Card>
              ) : (
                requests.map((req) => {
                  const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendente;
                  const StatusIcon = statusCfg.icon;
                  const usagePercent = req.quantidade > 0 ? Math.round((req.quantidade_utilizada / req.quantidade) * 100) : 0;
                  return (
                    <Card key={req.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={statusCfg.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusCfg.label}
                              </Badge>
                              <Badge variant="outline">
                                {TIPOS.find((t) => t.value === req.tipo)?.label || req.tipo}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{req.descricao}</h4>
                            <p className="text-sm text-muted-foreground">
                              📍 {req.localidade} {req.bairro ? `— ${req.bairro}` : ""} {req.cidade ? `(${req.cidade})` : ""}
                            </p>
                            <div className="flex gap-4 text-sm">
                              <span>Qtd: {req.quantidade}</span>
                              <span>Usado: {req.quantidade_utilizada} ({usagePercent}%)</span>
                              <span className="font-medium">{formatCurrency(req.valor_estimado)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(req.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4 flex-col sm:flex-row">
                            {isAdmin && req.status === "pendente" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, "aprovado")} className="text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, "recusado")} className="text-red-600">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {isAdmin && req.status === "aprovado" && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, "entregue")}>
                                <Package className="w-4 h-4 mr-1" /> Entregar
                              </Button>
                            )}
                            {(req.status === "entregue" || req.status === "aprovado") && (
                              <Button size="sm" variant="outline" onClick={() => {
                                setUsageDialog({ open: true, request: req });
                                setUsageAmount(String(req.quantidade_utilizada || 0));
                              }}>
                                <Edit className="w-4 h-4 mr-1" /> Uso
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventario">
            <MaterialInventory />
          </TabsContent>
        </Tabs>
      </div>

      {/* Usage Dialog */}
      <Dialog open={usageDialog.open} onOpenChange={(open) => !open && setUsageDialog({ open: false, request: null })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Uso</DialogTitle>
            <DialogDescription>
              {usageDialog.request && `Quantidade total: ${usageDialog.request.quantidade}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Quantidade Utilizada</Label>
              <Input type="number" value={usageAmount} onChange={(e) => setUsageAmount(e.target.value)} placeholder="Ex: 30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageDialog({ open: false, request: null })}>Cancelar</Button>
            <Button onClick={handleSaveUsage} disabled={savingUsage}>
              {savingUsage ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resources;
