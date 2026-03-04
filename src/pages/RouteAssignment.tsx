import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Route, Plus, Search, Loader2, Calendar, User, MapPin, CheckCircle, Clock, Play } from "lucide-react";

interface Street {
  id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
}

interface Profile {
  id: string;
  name: string;
}

interface RouteAssignment {
  id: string;
  assigned_to: string;
  assigned_by: string;
  street_id: string;
  data_planejada: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/10 text-blue-700" },
  concluido: { label: "Concluído", color: "bg-green-500/10 text-green-700" },
};

const RouteAssignmentPage = () => {
  const { user, isAdmin } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    assigned_to: "",
    street_id: "",
    data_planejada: "",
    notes: "",
  });

  // Maps for display
  const [streetMap, setStreetMap] = useState<Record<string, Street>>({});
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});

  const fetchData = useCallback(async () => {
    if (!user || !activeCampanhaId) { setLoading(false); return; }

    let assignQuery = supabase.from("route_assignments" as any).select("*").order("data_planejada", { ascending: true }) as any;
    let streetsQuery = supabase.from("streets").select("id, nome, bairro, cidade").order("nome");
    if (activeCampanhaId) {
      assignQuery = assignQuery.eq("campanha_id", activeCampanhaId);
      streetsQuery = streetsQuery.eq("campanha_id", activeCampanhaId);
    }
    const [assignmentsRes, streetsRes, profilesRes] = await Promise.all([
      assignQuery,
      streetsQuery,
      supabase.from("profiles").select("id, name"),
    ]);

    const assignData = (assignmentsRes.data || []) as RouteAssignment[];
    const streetData = (streetsRes.data || []) as Street[];
    const profileData = (profilesRes.data || []) as Profile[];

    setAssignments(assignData);
    setStreets(streetData);
    setProfiles(profileData);

    const sMap: Record<string, Street> = {};
    streetData.forEach((s) => (sMap[s.id] = s));
    setStreetMap(sMap);

    const pMap: Record<string, Profile> = {};
    profileData.forEach((p) => (pMap[p.id] = p));
    setProfileMap(pMap);

    setLoading(false);
  }, [user, activeCampanhaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCampanhaId) return;
    setCreating(true);

    const { error } = await (supabase.from("route_assignments" as any) as any).insert({
      campanha_id: activeCampanhaId,
      assigned_by: user.id,
      assigned_to: form.assigned_to,
      street_id: form.street_id,
      data_planejada: form.data_planejada,
      notes: form.notes || null,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Roteiro criado!" });
      setForm({ assigned_to: "", street_id: "", data_planejada: "", notes: "" });
      setShowForm(false);
      fetchData();
    }
    setCreating(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase
      .from("route_assignments" as any)
      .update({ status: newStatus })
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Status atualizado para ${STATUS_CONFIG[newStatus]?.label}` });
      fetchData();
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const street = streetMap[a.street_id];
    const profile = profileMap[a.assigned_to];
    const matchesSearch =
      !searchTerm ||
      street?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      street?.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Planejamento de Roteiro</h1>
            <p className="text-muted-foreground">Designe equipes para ruas e bairros específicos</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Designação
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nova Designação de Roteiro</CardTitle>
              <CardDescription>Atribua um membro da equipe a um logradouro para uma data específica</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Membro da Equipe *</Label>
                    <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Logradouro *</Label>
                    <Select value={form.street_id} onValueChange={(v) => setForm((p) => ({ ...p, street_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {streets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nome} {s.bairro ? `— ${s.bairro}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Planejada *</Label>
                    <Input
                      type="date"
                      value={form.data_planejada}
                      onChange={(e) => setForm((p) => ({ ...p, data_planejada: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Ex: Levar 200 santinhos, focar no lado par da rua..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating || !form.assigned_to || !form.street_id || !form.data_planejada}>
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : "Criar Designação"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por rua ou membro..." />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Route className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma designação</h3>
                <p className="text-muted-foreground mb-4">Crie a primeira designação de roteiro</p>
                <Button onClick={() => setShowForm(true)}>Nova Designação</Button>
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((a) => {
              const street = streetMap[a.street_id];
              const profile = profileMap[a.assigned_to];
              const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pendente;
              const isPast = new Date(a.data_planejada) < new Date(new Date().toDateString());

              return (
                <Card key={a.id} className={isPast && a.status === "pendente" ? "border-orange-300" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          {isPast && a.status === "pendente" && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">Atrasado</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">{profile?.name || "—"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {street?.nome || "—"} {street?.bairro ? `— ${street.bairro}` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {new Date(a.data_planejada + "T12:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {a.status === "pendente" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(a.id, "em_andamento")} className="gap-1">
                            <Play className="w-3 h-3" /> Iniciar
                          </Button>
                        )}
                        {a.status === "em_andamento" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(a.id, "concluido")} className="gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" /> Concluir
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
      </div>
    </div>
  );
};

export default RouteAssignmentPage;
