import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Search, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  campanhaId: string;
}

export function HistoricoVotacaoTab({ campanhaId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eleicao_id: "", municipio_id: "", votacao: "" });
  const [search, setSearch] = useState("");

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
      return data as Array<{
        id: string; eleicao_ano: number; cargo: string;
      }>;
    },
  });

  // Fetch municipios
  const { data: municipios } = useQuery({
    queryKey: ["municipios", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipios")
        .select("id, nome, estado")
        .eq("campanha_id", campanhaId)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch historico with joins
  const { data: historico, isLoading } = useQuery({
    queryKey: ["historico-votacao", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("municipio_historico_votacao")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("eleicao_ano", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Enrich historico with names
  const enriched = (historico || []).map(h => {
    const mun = municipios?.find(m => m.id === h.municipio_id);
    const el = eleicoes?.find(e => e.id === (h as any).eleicao_id);
    return {
      ...h,
      municipio_nome: mun?.nome || "—",
      municipio_estado: mun?.estado || "",
      eleicao_label: el ? `${el.eleicao_ano} — ${el.cargo}` : `${h.eleicao_ano} — ${h.cargo}`,
    };
  });

  const filtered = enriched.filter(h =>
    h.municipio_nome.toLowerCase().includes(search.toLowerCase()) ||
    h.cargo.toLowerCase().includes(search.toLowerCase()) ||
    h.eleicao_ano.toString().includes(search)
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      const eleicao = eleicoes?.find(e => e.id === form.eleicao_id);
      if (!eleicao) throw new Error("Selecione uma eleição");
      const { error } = await supabase.from("municipio_historico_votacao").insert({
        campanha_id: campanhaId,
        municipio_id: form.municipio_id,
        eleicao_ano: eleicao.eleicao_ano,
        cargo: eleicao.cargo,
        votacao: parseInt(form.votacao),
        eleicao_id: form.eleicao_id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-votacao", campanhaId] });
      toast({ title: "Votação registrada!" });
      setForm({ eleicao_id: "", municipio_id: "", votacao: "" });
      setShowForm(false);
    },
    onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
  });

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} registro(s)</span>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} disabled={!eleicoes?.length || !municipios?.length}>
              <Plus className="w-4 h-4 mr-2" /> Nova Votação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Eleição *</Label>
                <Select value={form.eleicao_id} onValueChange={v => setForm(f => ({ ...f, eleicao_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {eleicoes?.map(el => (
                      <SelectItem key={el.id} value={el.id}>{el.eleicao_ano} — {el.cargo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Município *</Label>
                <Select value={form.municipio_id} onValueChange={v => setForm(f => ({ ...f, municipio_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {municipios?.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nome} — {m.estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Votação *</Label>
                <Input type="number" placeholder="12500" value={form.votacao}
                  onChange={e => setForm(f => ({ ...f, votacao: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm({ eleicao_id: "", municipio_id: "", votacao: "" }); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={addMutation.isPending || !form.eleicao_id || !form.municipio_id || !form.votacao}
                onClick={() => addMutation.mutate()}>
                {addMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
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
                  <TableHead>Eleição</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{h.eleicao_label}</TableCell>
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
