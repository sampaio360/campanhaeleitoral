import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

interface MunicipioForm {
  nome: string;
  estado: string;
  populacao: string;
  zona_eleitoral: string;
  meta_votos: string;
  status: string;
  notes: string;
}

const emptyForm: MunicipioForm = {
  nome: "", estado: "", populacao: "", zona_eleitoral: "",
  meta_votos: "", status: "ativo", notes: ""
};

const Municipios = () => {
  const { campanhaId, isMaster, selectedCampanhaId } = useAuth();
  const activeCampanhaId = isMaster && selectedCampanhaId ? selectedCampanhaId : campanhaId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MunicipioForm>(emptyForm);
  const [search, setSearch] = useState("");
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Setup Google Places autocomplete for city search
  useEffect(() => {
    if (!dialogOpen) {
      autocompleteRef.current = null;
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let cancelled = false;

    function ensureGoogleLoaded(): Promise<void> {
      return new Promise((resolve) => {
        if (window.google?.maps?.places) { resolve(); return; }

        // If script tag exists, poll for it
        const existing = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existing) {
          const check = setInterval(() => {
            if (window.google?.maps?.places) { clearInterval(check); resolve(); }
          }, 150);
          return;
        }

        // Load fresh
        window.initGooglePlaces = () => resolve();
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
        script.async = true;
        document.head.appendChild(script);
      });
    }

    ensureGoogleLoaded().then(() => {
      if (cancelled || !nomeInputRef.current || autocompleteRef.current) return;

      // z-index fix
      if (!document.getElementById("pac-style")) {
        const style = document.createElement("style");
        style.id = "pac-style";
        style.textContent = `.pac-container { z-index: 99999 !important; }`;
        document.head.appendChild(style);
      }

      const ac = new window.google.maps.places.Autocomplete(nomeInputRef.current!, {
        types: ["(cities)"],
        componentRestrictions: { country: "br" },
        fields: ["address_components", "name"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.address_components) return;

        const getComp = (type: string, short = false) => {
          const comp = place.address_components.find((c: any) => c.types.includes(type));
          return short ? comp?.short_name || "" : comp?.long_name || "";
        };

        const cityName = getComp("administrative_area_level_2") || getComp("locality") || place.name || "";
        const uf = getComp("administrative_area_level_1", true);

        setForm(f => ({ ...f, nome: cityName, estado: uf }));
      });

      autocompleteRef.current = ac;
    });

    return () => { cancelled = true; };
  }, [dialogOpen]);

  const { data: municipios, isLoading } = useQuery({
    queryKey: ["municipios", activeCampanhaId],
    queryFn: async () => {
      if (!activeCampanhaId) return [];
      const { data, error } = await supabase
        .from("municipios")
        .select("*")
        .eq("campanha_id", activeCampanhaId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCampanhaId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeCampanhaId) throw new Error("Sem campanha ativa");
      const payload = {
        campanha_id: activeCampanhaId,
        nome: form.nome.trim(),
        estado: form.estado,
        populacao: form.populacao ? parseInt(form.populacao) : null,
        zona_eleitoral: form.zona_eleitoral || null,
        meta_votos: form.meta_votos ? parseInt(form.meta_votos) : null,
        status: form.status,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
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
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      nome: m.nome,
      estado: m.estado,
      populacao: m.populacao?.toString() || "",
      zona_eleitoral: m.zona_eleitoral || "",
      meta_votos: m.meta_votos?.toString() || "",
      status: m.status,
      notes: m.notes || "",
    });
    setDialogOpen(true);
  };

  const filtered = municipios?.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.estado.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Municípios</h1>
            <p className="text-sm text-muted-foreground">Gerencie os municípios da campanha</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                <Plus className="w-4 h-4 mr-2" /> Novo Município
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Município" : "Novo Município"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      ref={nomeInputRef}
                      value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Digite o nome da cidade"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="populacao">População</Label>
                    <Input id="populacao" type="number" value={form.populacao} onChange={e => setForm(f => ({ ...f, populacao: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_votos">Meta de Votos</Label>
                    <Input id="meta_votos" type="number" value={form.meta_votos} onChange={e => setForm(f => ({ ...f, meta_votos: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona Eleitoral</Label>
                    <Input id="zona" value={form.zona_eleitoral} onChange={e => setForm(f => ({ ...f, zona_eleitoral: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="prioritario">Prioritário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
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
              <Input
                placeholder="Buscar município..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground ml-auto">
                {filtered.length} município(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
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
                      <TableHead className="hidden sm:table-cell">População</TableHead>
                      <TableHead className="hidden md:table-cell">Meta Votos</TableHead>
                      <TableHead className="hidden md:table-cell">Zona</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell>{m.estado}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {m.populacao?.toLocaleString("pt-BR") || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {m.meta_votos?.toLocaleString("pt-BR") || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{m.zona_eleitoral || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={m.status === "prioritario" ? "default" : m.status === "ativo" ? "secondary" : "outline"}>
                            {m.status}
                          </Badge>
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
      </div>
    </div>
  );
};

export default Municipios;
