import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Pencil, Trash2, Search, CalendarDays, Vote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useIBGEMunicipios, fetchPopulacao } from "@/hooks/useIBGEMunicipios";
import { EleicoesTab } from "@/components/municipios/EleicoesTab";
import { HistoricoVotacaoTab } from "@/components/municipios/HistoricoVotacaoTab";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const PRIORIDADES = [
  { value: "critica", label: "Crítica", color: "destructive" as const },
  { value: "alta", label: "Alta", color: "default" as const },
  { value: "media", label: "Média", color: "secondary" as const },
  { value: "baixa", label: "Baixa", color: "outline" as const },
];

interface MunicipioForm {
  nome: string; estado: string; populacao: string;
  meta_votos: string; status: string; prioridade: string; notes: string;
}

const emptyForm: MunicipioForm = {
  nome: "", estado: "", populacao: "",
  meta_votos: "", status: "ativo", prioridade: "media", notes: ""
};

const Municipios = () => {
  const { campanhaId, isMaster, selectedCampanhaId } = useAuth();
  const activeCampanhaId = selectedCampanhaId || campanhaId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MunicipioForm>(emptyForm);
  const [searchTable, setSearchTable] = useState("");

  const ibge = useIBGEMunicipios();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) { ibge.close(); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ibge.close]);

  const handleSelectMunicipio = async (m: { id: number; nome: string; uf: string }) => {
    setForm(f => ({ ...f, nome: m.nome, estado: m.uf }));
    ibge.setQuery(m.nome);
    ibge.close();
    const pop = await fetchPopulacao(m.id);
    if (pop) setForm(f => ({ ...f, populacao: pop }));
  };

  const { data: municipios, isLoading } = useQuery({
    queryKey: ["municipios", activeCampanhaId],
    queryFn: async () => {
      if (!activeCampanhaId) return [];
      const { data, error } = await supabase
        .from("municipios").select("*").eq("campanha_id", activeCampanhaId).order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCampanhaId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeCampanhaId) throw new Error("Sem campanha ativa");
      const payload = {
        campanha_id: activeCampanhaId, nome: form.nome.trim(), estado: form.estado,
        populacao: form.populacao ? parseInt(form.populacao) : null,
        meta_votos: form.meta_votos ? parseInt(form.meta_votos) : null,
        status: form.status, prioridade: form.prioridade,
        notes: form.notes || null, updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("municipios").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("municipios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipios"] });
      toast({ title: editingId ? "Município atualizado!" : "Município cadastrado!" });
      closeDialog();
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate")
        ? "Este município já está cadastrado nesta campanha."
        : err?.message || "Erro ao salvar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("municipios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipios"] });
      toast({ title: "Município removido!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false); setEditingId(null); setForm(emptyForm);
    ibge.setQuery(""); ibge.close();
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      nome: m.nome, estado: m.estado,
      populacao: m.populacao?.toString() || "", meta_votos: m.meta_votos?.toString() || "",
      status: m.status, prioridade: m.prioridade || "media", notes: m.notes || "",
    });
    ibge.setQuery(m.nome); setDialogOpen(true);
  };

  const filtered = municipios?.filter(m =>
    m.nome.toLowerCase().includes(searchTable.toLowerCase()) ||
    m.estado.toLowerCase().includes(searchTable.toLowerCase())
  ) || [];

  const getPrioridadeBadge = (p: string) => {
    const prio = PRIORIDADES.find(x => x.value === p);
    return prio ? <Badge variant={prio.color}>{prio.label}</Badge> : <Badge variant="secondary">Média</Badge>;
  };

  if (!activeCampanhaId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecione uma campanha para gerenciar municípios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4">
        <Tabs defaultValue="municipios" className="space-y-4">
          <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
            <div className="mb-4 pt-6 sm:pt-8">
              <h1 className="text-2xl sm:text-3xl font-bold">Municípios</h1>
              <p className="text-sm text-muted-foreground">Gerencie municípios, eleições e histórico de votação</p>
            </div>
            <TabsList>
              <TabsTrigger value="municipios" className="gap-2">
                <MapPin className="w-4 h-4" /> Municípios
              </TabsTrigger>
              <TabsTrigger value="eleicoes" className="gap-2">
                <CalendarDays className="w-4 h-4" /> Eleições
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <Vote className="w-4 h-4" /> Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Municípios Tab ── */}
          <TabsContent value="municipios">
            <div className="flex justify-end mb-4">
              <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingId(null); setForm(emptyForm); ibge.setQuery(""); }}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Município
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Município" : "Novo Município"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 relative">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input id="nome" ref={inputRef} value={ibge.query}
                          onChange={e => { ibge.setQuery(e.target.value); setForm(f => ({ ...f, nome: e.target.value })); }}
                          placeholder="Digite o nome da cidade" autoComplete="off" required />
                        {ibge.isOpen && (
                          <div ref={suggestionsRef}
                            className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-52 overflow-y-auto">
                            {ibge.suggestions.map((s) => (
                              <button key={s.id} type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={() => handleSelectMunicipio(s)}>
                                {s.nome} <span className="text-muted-foreground">— {s.uf}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Estado *</Label>
                        <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>População</Label>
                        <Input type="number" value={form.populacao} onChange={e => setForm(f => ({ ...f, populacao: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Meta de Votos</Label>
                        <Input type="number" value={form.meta_votos} onChange={e => setForm(f => ({ ...f, meta_votos: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                      <Button type="submit" disabled={saveMutation.isPending || !form.nome || !form.estado}>
                        {saveMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar município..." value={searchTable}
                    onChange={e => setSearchTable(e.target.value)} className="max-w-xs" />
                  <span className="text-sm text-muted-foreground ml-auto">{filtered.length} município(s)</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum município cadastrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Município</TableHead>
                          <TableHead>UF</TableHead>
                          <TableHead>População</TableHead>
                          <TableHead>Meta Votos</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.nome}</TableCell>
                            <TableCell>{m.estado}</TableCell>
                            <TableCell>{m.populacao?.toLocaleString("pt-BR") || "—"}</TableCell>
                            <TableCell>{m.meta_votos?.toLocaleString("pt-BR") || "—"}</TableCell>
                            <TableCell>{getPrioridadeBadge(m.prioridade || "media")}</TableCell>
                            <TableCell>
                              <Badge variant={m.status === "ativo" ? "secondary" : "outline"}>{m.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  if (confirm("Remover este município?")) deleteMutation.mutate(m.id);
                                }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Eleições Tab ── */}
          <TabsContent value="eleicoes">
            <EleicoesTab campanhaId={activeCampanhaId} />
          </TabsContent>

          {/* ── Histórico Tab ── */}
          <TabsContent value="historico">
            <HistoricoVotacaoTab campanhaId={activeCampanhaId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Municipios;
