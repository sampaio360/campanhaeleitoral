import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { enqueueOffline } from "@/lib/offlineSync";
import { CascadingAddressForm } from "@/components/checkin/CascadingAddressForm";
import { MapPin, Play, Square, Plus, Search, Loader2, MessageSquare, Camera } from "lucide-react";


interface Street {
  id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
  status_cobertura?: string;
}

interface Checkin {
  id: string;
  street_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  streets?: {
    nome: string;
    bairro: string | null;
    cidade: string | null;
  };
}

// Offline sync is now handled by the centralized offlineSync service

const STATUS_COBERTURA_LABELS: Record<string, { label: string; color: string }> = {
  nao_visitada: { label: "Não visitada", color: "bg-muted text-muted-foreground" },
  em_visitacao: { label: "Em visitação", color: "bg-yellow-500/10 text-yellow-700" },
  concluida: { label: "Concluída", color: "bg-green-500/10 text-green-700" },
  necessita_retorno: { label: "Retorno necessário", color: "bg-orange-500/10 text-orange-700" },
};

const StreetCheckin = () => {
  const { user, campanhaId: profileCampanhaId, isMaster, selectedCampanhaId } = useAuth();
  const campanhaId = selectedCampanhaId || profileCampanhaId;
  const { toast } = useToast();
  const [streets, setStreets] = useState<Street[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStreetId, setSelectedStreetId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddStreet, setShowAddStreet] = useState(false);
  const [creating, setCreating] = useState(false);

  // Feedback dialog state
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; checkinId: string }>({ open: false, checkinId: "" });
  const [feedbackClima, setFeedbackClima] = useState<string>("");
  const [feedbackDemandas, setFeedbackDemandas] = useState("");
  const [liderancas, setLiderancas] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || (!campanhaId && !isMaster)) { setLoading(false); return; }
    try {
      let streetsQ = supabase.from("streets").select("*").order("nome");
      let checkinsQ = supabase.from("street_checkins").select("*, streets(nome, bairro, cidade)").order("started_at", { ascending: false }).limit(50);
      if (campanhaId) {
        streetsQ = streetsQ.eq("campanha_id", campanhaId);
        checkinsQ = checkinsQ.eq("campanha_id", campanhaId);
      }
      const [streetsRes, checkinsRes] = await Promise.all([streetsQ, checkinsQ]);
      setStreets((streetsRes.data as any[]) || []);
      setCheckins((checkinsRes.data as any[]) || []);
    } catch (err) {
      console.error("Error fetching checkin data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, campanhaId, isMaster]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleStartCheckin = async () => {
    if (!selectedStreetId || !user || !campanhaId) return;
    setCreating(true);

    try {
      const { data: activeCheckins, error: checkError } = await supabase
        .from("street_checkins")
        .select("id")
        .eq("street_id", selectedStreetId)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (activeCheckins && activeCheckins.length > 0) {
        toast({
          title: "Conflito detectado",
          description: "Já existe uma equipe trabalhando nesta rua no momento.",
          variant: "destructive",
        });
        setCreating(false);
        return;
      }

      const payload = {
        street_id: selectedStreetId,
        campanha_id: campanhaId,
        user_id: user.id,
        status: "active",
        notes: notes || null,
      };

      const { error } = await supabase.from("street_checkins").insert(payload);
      if (error) throw error;

      toast({ title: "Check-in iniciado!", description: "Ação de rua registrada com sucesso." });
      setNotes("");
      setSelectedStreetId("");
      fetchData();
    } catch (err: any) {
      // Offline fallback: enqueue for later sync
      if (!navigator.onLine) {
        const payload = {
          street_id: selectedStreetId,
          campanha_id: campanhaId,
          user_id: user.id,
          status: "active",
          notes: notes || null,
        };
        enqueueOffline("street_checkins", payload);
        toast({ title: "Salvo offline", description: "Será sincronizado quando a conexão voltar." });
        setNotes("");
        setSelectedStreetId("");
      } else {
        console.error(err);
        toast({ title: "Erro", description: "Não foi possível iniciar o check-in.", variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEndCheckin = (checkinId: string) => {
    setFeedbackDialog({ open: true, checkinId });
    setFeedbackClima("");
    setFeedbackDemandas("");
    setLiderancas("");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const submitFeedbackAndEnd = async () => {
    setSubmittingFeedback(true);
    const updatePayload: any = {
      status: "completed",
      ended_at: new Date().toISOString(),
    };
    if (feedbackClima) updatePayload.feedback_clima = feedbackClima;
    if (feedbackDemandas) updatePayload.feedback_demandas = feedbackDemandas;
    if (liderancas) updatePayload.liderancas_identificadas = liderancas;

    // Upload photo if present
    if (photo && user) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${feedbackDialog.checkinId}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("checkin-photos").upload(path, photo);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("checkin-photos").getPublicUrl(path);
        updatePayload.photo_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("street_checkins")
      .update(updatePayload)
      .eq("id", feedbackDialog.checkinId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ação encerrada com feedback!" });
      setFeedbackDialog({ open: false, checkinId: "" });
      setPhoto(null);
      setPhotoPreview(null);
      fetchData();
    }
    setSubmittingFeedback(false);
  };

  const handleAddStreet = async (data: { nome: string; bairro: string; cidade: string; latitude?: number; longitude?: number }) => {
    if (!data.nome || !campanhaId) return;
    setCreating(true);
    const { error } = await supabase.from("streets").insert({
      campanha_id: campanhaId,
      nome: data.nome,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Rua já cadastrada", description: "Este logradouro já existe nesta campanha.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao cadastrar rua", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Rua cadastrada!" });
      setShowAddStreet(false);
      fetchData();
    }
    setCreating(false);
  };

  const filteredStreets = streets.filter((s) =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.bairro && s.bairro.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCheckinsList = checkins.filter((c) => c.status === "active");
  const recentCheckins = checkins.filter((c) => c.status !== "active").slice(0, 10);

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
            <h1 className="text-3xl font-bold">Check-in de Rua</h1>
            <p className="text-muted-foreground">Registro de ações de campo em tempo real</p>
          </div>
          <Button onClick={() => setShowAddStreet(!showAddStreet)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Nova Rua
          </Button>
        </div>

        <CascadingAddressForm
          visible={showAddStreet}
          creating={creating}
          onSubmit={handleAddStreet}
          onCancel={() => setShowAddStreet(false)}
        />

        {activeCheckinsList.length > 0 && (
          <Card className="mb-6 border-green-500/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                Atividades em Curso ({activeCheckinsList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCheckinsList.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-100">
                  <div>
                    <p className="font-semibold">{c.streets?.nome || "Rua"}</p>
                    <p className="text-xs text-muted-foreground">
                      Iniciado em: {new Date(c.started_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleEndCheckin(c.id)} className="gap-2">
                    <Square className="w-3 h-3 fill-current" /> Encerrar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle>Iniciar Nova Ação</CardTitle>
            <CardDescription>Escolha um logradouro livre para iniciar os trabalhos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pesquisar Logradouro</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome ou bairro..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selecionar Rua</Label>
                <Select value={selectedStreetId} onValueChange={setSelectedStreetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStreets.map((s) => {
                      const statusCfg = STATUS_COBERTURA_LABELS[s.status_cobertura || "nao_visitada"];
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            {s.nome} {s.bairro ? `— ${s.bairro}` : ""}
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${statusCfg.color}`}>
                              {statusCfg.label}
                            </Badge>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas do Início (Opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Ponto de encontro em frente à farmácia..." />
            </div>
            <Button onClick={handleStartCheckin} disabled={!selectedStreetId || creating} className="w-full sm:w-auto gap-2" variant="campaign">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Iniciar Trabalho de Campo
            </Button>
          </CardContent>
        </Card>

        {recentCheckins.length > 0 && (
          <Card className="shadow-none border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCheckins.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{c.streets?.nome || "Rua"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.started_at).toLocaleTimeString("pt-BR")} - {c.ended_at ? new Date(c.ended_at).toLocaleTimeString("pt-BR") : "Em aberto"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Concluido
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => !open && setFeedbackDialog({ open: false, checkinId: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback da Visita
            </DialogTitle>
            <DialogDescription>
              Registre informações de inteligência de campo antes de encerrar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Clima da Recepção</Label>
              <Select value={feedbackClima} onValueChange={setFeedbackClima}>
                <SelectTrigger>
                  <SelectValue placeholder="Como foi a recepção?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptivo">😊 Receptivo</SelectItem>
                  <SelectItem value="neutro">😐 Neutro</SelectItem>
                  <SelectItem value="hostil">😠 Hostil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Demandas da População</Label>
              <Textarea
                value={feedbackDemandas}
                onChange={(e) => setFeedbackDemandas(e.target.value)}
                placeholder="O que o povo pediu? Ex: Calçamento, iluminação, posto de saúde..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Lideranças Identificadas</Label>
              <Textarea
                value={liderancas}
                onChange={(e) => setLiderancas(e.target.value)}
                placeholder="Nomes de lideranças locais encontradas..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Camera className="w-4 h-4" /> Foto (Opcional)</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} />
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="rounded-lg max-h-32 object-cover" />
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedbackDialog({ open: false, checkinId: "" })}>
              Cancelar
            </Button>
            <Button onClick={submitFeedbackAndEnd} disabled={submittingFeedback}>
              {submittingFeedback && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Encerrar com Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StreetCheckin;
