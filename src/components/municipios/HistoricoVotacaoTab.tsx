import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Search, Vote, Save, X } from "lucide-react";
import { HistoricoImport } from "./HistoricoImport";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  campanhaId: string;
}

interface LinhaVoto {
  municipio_id: string;
  votacao: string;
}

export function HistoricoVotacaoTab({ campanhaId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Batch insert state
  const [selectedEleicaoId, setSelectedEleicaoId] = useState("");
  const [linhas, setLinhas] = useState<LinhaVoto[]>([]);
  const isInserting = !!selectedEleicaoId;

  const addLinha = () => setLinhas(prev => [...prev, { municipio_id: "", votacao: "" }]);
  const removeLinha = (idx: number) => setLinhas(prev => prev.filter((_, i) => i !== idx));
  const updateLinha = (idx: number, field: keyof LinhaVoto, value: string) =>
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

  const cancelInsertion = () => { setSelectedEleicaoId(""); setLinhas([]); };

  // Fetch elections
  const { data: eleicoes } = useQuery({
    queryKey: ["eleicoes", campanhaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipio_eleicoes")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("eleicao_ano", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; eleicao_ano: number; cargo: string }>;
    },
  });

  // Fetch municipios
  const { data: municipios } = useQuery({
    queryKey: ["municipios-names", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipios").select("id, nome, estado")
        .eq("campanha_id", campanhaId).order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch historico
  const { data: historico, isLoading } = useQuery({
    queryKey: ["historico-votacao", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipio_historico_votacao").select("*")
        .eq("campanha_id", campanhaId)
        .order("eleicao_ano", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enriched = (historico || []).map(h => {
    const mun = municipios?.find(m => m.id === h.municipio_id);
    return {
      ...h,
      municipio_nome: mun?.nome || "—",
      municipio_estado: mun?.estado || "",
    };
  });

  const filtered = enriched.filter(h =>
    h.municipio_nome.toLowerCase().includes(search.toLowerCase()) ||
    h.cargo.toLowerCase().includes(search.toLowerCase()) ||
    h.eleicao_ano.toString().includes(search)
  );

  // Batch save
  const saveBatchMutation = useMutation({
    mutationFn: async () => {
      const eleicao = eleicoes?.find(e => e.id === selectedEleicaoId);
      if (!eleicao) throw new Error("Eleição não encontrada");
      const validLinhas = linhas.filter(l => l.municipio_id && l.votacao);
      if (!validLinhas.length) throw new Error("Adicione pelo menos um registro");
      const rows = validLinhas.map(l => ({
        campanha_id: campanhaId,
        municipio_id: l.municipio_id,
        eleicao_ano: eleicao.eleicao_ano,
        cargo: eleicao.cargo,
        votacao: parseInt(l.votacao),
        eleicao_id: selectedEleicaoId,
      }));
      const { error } = await supabase.from("municipio_historico_votacao").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-votacao", campanhaId] });
      toast({ title: `${linhas.filter(l => l.municipio_id && l.votacao).length} registro(s) salvos!` });
      cancelInsertion();
    },
    onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
  });

  // Delete single
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("municipio_historico_votacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-votacao", campanhaId] });
      toast({ title: "Registro removido!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  // Municípios already used in current batch (to avoid duplicates)
  const usedMunicipioIds = new Set(linhas.map(l => l.municipio_id).filter(Boolean));

  const validCount = linhas.filter(l => l.municipio_id && l.votacao).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} registro(s)</span>
          </div>
          {!isInserting && (
            <Button size="sm" onClick={() => { setSelectedEleicaoId(""); setLinhas([]); setSelectedEleicaoId("pick"); }}
              disabled={!eleicoes?.length || !municipios?.length}>
              <Plus className="w-4 h-4 mr-2" /> Lançar Votação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(!eleicoes?.length || !municipios?.length) && !isLoading && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">
            {!eleicoes?.length ? "Cadastre uma eleição na aba 'Eleições' primeiro. " : ""}
            {!municipios?.length ? "Cadastre municípios na aba 'Municípios' primeiro." : ""}
          </p>
        )}

        {/* Batch insertion area */}
        {isInserting && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30 mb-4">
            {/* Step 1: choose election */}
            <div className="space-y-1 max-w-sm">
              <Label className="text-xs font-semibold">Eleição *</Label>
              <Select value={selectedEleicaoId === "pick" ? "" : selectedEleicaoId}
                onValueChange={v => { setSelectedEleicaoId(v); setLinhas([{ municipio_id: "", votacao: "" }]); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a eleição" /></SelectTrigger>
                <SelectContent>
                  {eleicoes?.map(el => (
                    <SelectItem key={el.id} value={el.id}>{el.eleicao_ano} — {el.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: add municipio+votacao lines */}
            {selectedEleicaoId && selectedEleicaoId !== "pick" && (
              <>
                <div className="space-y-2">
                  {linhas.map((linha, idx) => (
                    <div key={idx} className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        {idx === 0 && <Label className="text-xs">Município</Label>}
                        <Select value={linha.municipio_id}
                          onValueChange={v => updateLinha(idx, "municipio_id", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {municipios?.filter(m => !usedMunicipioIds.has(m.id) || m.id === linha.municipio_id)
                              .map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.nome} — {m.estado}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32 space-y-1">
                        {idx === 0 && <Label className="text-xs">Votação</Label>}
                        <Input type="number" placeholder="12500" value={linha.votacao}
                          onChange={e => updateLinha(idx, "votacao", e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                        onClick={() => removeLinha(idx)} disabled={linhas.length === 1}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={addLinha}>
                    <Plus className="w-4 h-4 mr-1" /> Mais município
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelInsertion}>Cancelar</Button>
                    <Button size="sm" disabled={saveBatchMutation.isPending || validCount === 0}
                      onClick={() => saveBatchMutation.mutate()}>
                      <Save className="w-4 h-4 mr-1" />
                      {saveBatchMutation.isPending ? "Salvando..." : `Salvar ${validCount} registro(s)`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {(!eleicoes?.length || !municipios?.length) && !isLoading && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">
            {!eleicoes?.length ? "Cadastre uma eleição na aba 'Eleições' primeiro. " : ""}
            {!municipios?.length ? "Cadastre municípios na aba 'Municípios' primeiro." : ""}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !filtered.length ? (
          <div className="text-center py-12">
            <Vote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum registro de votação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead className="text-right">Votação</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.eleicao_ano}</TableCell>
                    <TableCell>{h.cargo}</TableCell>
                    <TableCell className="font-medium">{h.municipio_nome}</TableCell>
                    <TableCell>{h.municipio_estado}</TableCell>
                    <TableCell className="text-right font-semibold">{h.votacao.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Remover este registro?")) deleteMutation.mutate(h.id);
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
