import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ChevronDown, ChevronRight, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Props {
  municipioId: string;
  municipioNome: string;
  campanhaId: string;
  open: boolean;
  onClose: () => void;
}

export function MunicipioVotingHistory({ municipioId, municipioNome, campanhaId, open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Election form
  const [showEleicaoForm, setShowEleicaoForm] = useState(false);
  const [eleicaoForm, setEleicaoForm] = useState({ ano: "", cargo: "" });

  // Vote form per election
  const [addingVotoFor, setAddingVotoFor] = useState<string | null>(null);
  const [votoValue, setVotoValue] = useState("");

  // Expanded elections
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Fetch elections for this município
  const { data: eleicoes, isLoading: loadingEleicoes } = useQuery({
    queryKey: ["municipio-eleicoes", municipioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipio_eleicoes")
        .select("*")
        .eq("municipio_id", municipioId)
        .order("eleicao_ano", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        municipio_id: string;
        campanha_id: string;
        eleicao_ano: number;
        cargo: string;
        notes: string | null;
        created_at: string;
      }>;
    },
    enabled: open,
  });

  // Fetch all votes for this município
  const { data: votos, isLoading: loadingVotos } = useQuery({
    queryKey: ["municipio-votos", municipioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipio_historico_votacao")
        .select("*")
        .eq("municipio_id", municipioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Group votes by eleicao_id
  const votosByEleicao = (votos || []).reduce<Record<string, typeof votos>>((acc, v) => {
    const key = (v as any).eleicao_id || "orphan";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(v);
    return acc;
  }, {});

  // Create election
  const addEleicaoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("municipio_eleicoes").insert({
        municipio_id: municipioId,
        campanha_id: campanhaId,
        eleicao_ano: parseInt(eleicaoForm.ano),
        cargo: eleicaoForm.cargo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipio-eleicoes", municipioId] });
      toast({ title: "Eleição cadastrada!" });
      setEleicaoForm({ ano: "", cargo: "" });
      setShowEleicaoForm(false);
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate")
        ? "Esta eleição/cargo já está cadastrada."
        : err?.message || "Erro ao salvar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  // Delete election
  const deleteEleicaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("municipio_eleicoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipio-eleicoes", municipioId] });
      queryClient.invalidateQueries({ queryKey: ["municipio-votos", municipioId] });
      toast({ title: "Eleição removida!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  // Add vote to election
  const addVotoMutation = useMutation({
    mutationFn: async (eleicaoId: string) => {
      const eleicao = eleicoes?.find(e => e.id === eleicaoId);
      if (!eleicao) throw new Error("Eleição não encontrada");
      const { error } = await supabase.from("municipio_historico_votacao").insert({
        municipio_id: municipioId,
        campanha_id: campanhaId,
        eleicao_ano: eleicao.eleicao_ano,
        cargo: eleicao.cargo,
        votacao: parseInt(votoValue),
        eleicao_id: eleicaoId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipio-votos", municipioId] });
      toast({ title: "Votação registrada!" });
      setVotoValue("");
      setAddingVotoFor(null);
    },
    onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
  });

  // Delete vote
  const deleteVotoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("municipio_historico_votacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipio-votos", municipioId] });
      toast({ title: "Registro removido!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const isLoading = loadingEleicoes || loadingVotos;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Votação — {municipioNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add election form */}
          {showEleicaoForm ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">Nova Eleição</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ano *</Label>
                  <Input type="number" placeholder="2024" value={eleicaoForm.ano}
                    onChange={e => setEleicaoForm(f => ({ ...f, ano: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cargo *</Label>
                  <Input placeholder="Prefeito" value={eleicaoForm.cargo}
                    onChange={e => setEleicaoForm(f => ({ ...f, cargo: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setShowEleicaoForm(false); setEleicaoForm({ ano: "", cargo: "" }); }}>
                  Cancelar
                </Button>
                <Button size="sm"
                  disabled={addEleicaoMutation.isPending || !eleicaoForm.ano || !eleicaoForm.cargo}
                  onClick={() => addEleicaoMutation.mutate()}>
                  {addEleicaoMutation.isPending ? "Salvando..." : "Cadastrar Eleição"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowEleicaoForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nova Eleição
            </Button>
          )}

          <Separator />

          {/* Elections list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !eleicoes?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma eleição cadastrada. Clique em "Nova Eleição" para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {eleicoes.map(el => {
                const isOpen = expanded.has(el.id);
                const elVotos = votosByEleicao[el.id] || [];
                const totalVotos = elVotos.reduce((sum, v) => sum + (v.votacao || 0), 0);

                return (
                  <div key={el.id} className="border rounded-lg overflow-hidden">
                    {/* Election header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => toggleExpand(el.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-semibold text-sm">{el.eleicao_ano}</span>
                        <span className="text-sm text-muted-foreground">— {el.cargo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {elVotos.length} registro(s) · {totalVotos.toLocaleString("pt-BR")} votos
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Remover esta eleição e todos os registros de votação?")) deleteEleicaoMutation.mutate(el.id);
                        }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Votes */}
                    {isOpen && (
                      <div className="px-4 py-3 space-y-3">
                        {/* Add vote inline */}
                        {addingVotoFor === el.id ? (
                          <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Votação *</Label>
                              <Input type="number" placeholder="12500" value={votoValue}
                                onChange={e => setVotoValue(e.target.value)} autoFocus />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => { setAddingVotoFor(null); setVotoValue(""); }}>
                              Cancelar
                            </Button>
                            <Button size="sm" disabled={addVotoMutation.isPending || !votoValue}
                              onClick={() => addVotoMutation.mutate(el.id)}>
                              {addVotoMutation.isPending ? "..." : "Salvar"}
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingVotoFor(el.id)}>
                            <Vote className="w-4 h-4 mr-2" /> Adicionar Votação
                          </Button>
                        )}

                        {/* Votes table */}
                        {elVotos.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Votação</TableHead>
                                <TableHead className="text-right">Data Registro</TableHead>
                                <TableHead className="w-10" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {elVotos.map(v => (
                                <TableRow key={v.id}>
                                  <TableCell className="font-medium">{v.votacao.toLocaleString("pt-BR")}</TableCell>
                                  <TableCell className="text-right text-xs text-muted-foreground">
                                    {new Date(v.created_at).toLocaleDateString("pt-BR")}
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                      if (confirm("Remover este registro?")) deleteVotoMutation.mutate(v.id);
                                    }}>
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}

                        {elVotos.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">Nenhuma votação registrada.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
