import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Brain, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useInteligenciaAnalises,
  useUpsertInteligenciaAnalise,
  useDeleteInteligenciaAnalise,
  uploadCapaInteligencia,
  type InteligenciaAnalise,
} from "@/hooks/useInteligenciaAnalises";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";

interface FormState {
  id?: string;
  nome: string;
  descricao: string;
  url: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
}

const empty: FormState = {
  nome: "",
  descricao: "",
  url: "",
  imagem_url: "",
  ordem: 0,
  ativo: true,
};

export function AdminInteligencia() {
  const campanhaId = useActiveCampanhaId();
  const { data: analises, isLoading } = useInteligenciaAnalises();
  const upsert = useUpsertInteligenciaAnalise();
  const del = useDeleteInteligenciaAnalise();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [uploading, setUploading] = useState(false);

  const startCreate = () => {
    setForm(empty);
    setOpen(true);
  };

  const startEdit = (a: InteligenciaAnalise) => {
    setForm({
      id: a.id,
      nome: a.nome,
      descricao: a.descricao ?? "",
      url: a.url,
      imagem_url: a.imagem_url ?? "",
      ordem: a.ordem,
      ativo: a.ativo,
    });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadCapaInteligencia(file);
      setForm((f) => ({ ...f, imagem_url: url }));
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.url.trim()) {
      toast({ title: "Preencha nome e URL", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        id: form.id,
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        url: form.url.trim(),
        imagem_url: form.imagem_url.trim() || null,
        ordem: Number(form.ordem) || 0,
        ativo: form.ativo,
      });
      toast({ title: form.id ? "Análise atualizada" : "Análise criada" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta análise?")) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Análise excluída" });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  if (!campanhaId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Selecione uma campanha para gerenciar as análises.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-700" />
            Inteligência Eleitoral
          </CardTitle>
          <CardDescription>
            Cadastre análises externas. Cada análise vira um card no módulo, visível apenas para a campanha atual.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Nova análise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar análise" : "Nova análise"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>URL da análise *</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Imagem de capa</Label>
                <div className="flex items-center gap-3">
                  {form.imagem_url ? (
                    <img src={form.imagem_url} alt="Capa" className="w-20 h-12 object-cover rounded border" />
                  ) : (
                    <div className="w-20 h-12 rounded border bg-muted flex items-center justify-center">
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                </div>
                {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={upsert.isPending}>
                  {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
        ) : !analises || analises.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma análise cadastrada ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Capa</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">URL</TableHead>
                <TableHead className="w-20">Ordem</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analises.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.imagem_url ? (
                      <img src={a.imagem_url} alt="" className="w-12 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-8 rounded bg-cyan-100 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-cyan-700" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{a.nome}</div>
                    {a.descricao && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{a.descricao}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-[260px]">
                    {a.url}
                  </TableCell>
                  <TableCell>{a.ordem}</TableCell>
                  <TableCell>{a.ativo ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(a)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-4 h-4" />
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
