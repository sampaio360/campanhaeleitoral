import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  campanhaId: string;
}

export function EleicoesTab({ campanhaId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ano: "", cargo: "" });

  const { data: eleicoes, isLoading } = useQuery({
    queryKey: ["eleicoes", campanhaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipio_eleicoes")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("eleicao_ano", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; campanha_id: string; eleicao_ano: number; cargo: string;
        notes: string | null; created_at: string;
      }>;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("municipio_eleicoes").insert({
        campanha_id: campanhaId,
        eleicao_ano: parseInt(form.ano),
        cargo: form.cargo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleicoes", campanhaId] });
      toast({ title: "Eleição cadastrada!" });
      setForm({ ano: "", cargo: "" });
      setShowForm(false);
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate")
        ? "Esta eleição/cargo já existe."
        : err?.message || "Erro ao salvar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("municipio_eleicoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleicoes", campanhaId] });
      queryClient.invalidateQueries({ queryKey: ["historico-votacao", campanhaId] });
      toast({ title: "Eleição removida!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{eleicoes?.length || 0} eleição(ões)</p>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nova Eleição
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ano *</Label>
                <Input type="number" placeholder="2024" value={form.ano}
                  onChange={e => setForm(f => ({ ...f, ano: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cargo *</Label>
                <Input placeholder="Prefeito" value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm({ ano: "", cargo: "" }); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={addMutation.isPending || !form.ano || !form.cargo}
                onClick={() => addMutation.mutate()}>
                {addMutation.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !eleicoes?.length ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma eleição cadastrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {eleicoes.map(el => (
                <TableRow key={el.id}>
                  <TableCell className="font-medium">{el.eleicao_ano}</TableCell>
                  <TableCell>{el.cargo}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Remover esta eleição e todos os registros vinculados?")) deleteMutation.mutate(el.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
