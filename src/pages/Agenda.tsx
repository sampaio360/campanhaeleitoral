import { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, Plus, Search, Loader2, MapPin, Clock, User,
  ChevronLeft, ChevronRight, Megaphone, Users, Mic, Car, Handshake,
  Building2, PartyPopper, Flag, Coffee, Tv, FileText, MoreHorizontal,
  AlertTriangle, CheckCircle, XCircle, Edit, Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ───── Types ───── */

interface AgendaEvent {
  id: string;
  campanha_id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  cidade: string | null;
  bairro: string | null;
  responsavel_id: string | null;
  status: string;
  prioridade: string;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
}

/* ───── Config ───── */

const EVENT_TYPES: Record<string, { label: string; icon: typeof Megaphone; color: string }> = {
  comicio: { label: "Comício", icon: Megaphone, color: "bg-red-500/10 text-red-700 border-red-200" },
  reuniao: { label: "Reunião", icon: Users, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  debate: { label: "Debate", icon: Mic, color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  carreata: { label: "Carreata", icon: Car, color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  corpo_a_corpo: { label: "Corpo a Corpo", icon: Handshake, color: "bg-teal-500/10 text-teal-700 border-teal-200" },
  visita_institucional: { label: "Visita Institucional", icon: Building2, color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
  evento_partidario: { label: "Evento Partidário", icon: PartyPopper, color: "bg-pink-500/10 text-pink-700 border-pink-200" },
  panfletagem: { label: "Panfletagem", icon: FileText, color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  inauguracao: { label: "Inauguração de Comitê", icon: Flag, color: "bg-green-500/10 text-green-700 border-green-200" },
  entrevista: { label: "Entrevista / Mídia", icon: Tv, color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  cafe_com_liderancas: { label: "Café com Lideranças", icon: Coffee, color: "bg-yellow-500/10 text-yellow-800 border-yellow-200" },
  outro: { label: "Outro", icon: MoreHorizontal, color: "bg-muted text-muted-foreground border-border" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmado: { label: "Confirmado", color: "bg-green-500/10 text-green-700" },
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
  realizado: { label: "Realizado", color: "bg-blue-500/10 text-blue-700" },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
  baixa: { label: "Baixa", color: "bg-accent text-accent-foreground" },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ───── Component ───── */

const AgendaPage = () => {
  const { user, campanhaId, isMaster, selectedCampanhaId, isAdmin } = useAuth();
  const activeCampanhaId = selectedCampanhaId || campanhaId;
  const { toast } = useToast();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState("calendario");

  const emptyForm = {
    titulo: "", descricao: "", tipo: "reuniao", data_inicio: "", hora_inicio: "09:00",
    data_fim: "", hora_fim: "", local: "", cidade: "", bairro: "",
    responsavel_id: "", status: "confirmado", prioridade: "normal", notas: "",
  };
  const [form, setForm] = useState(emptyForm);

  /* ───── Data Fetching ───── */

  const fetchData = useCallback(async () => {
    if (!user || (!activeCampanhaId && !isMaster)) { setLoading(false); return; }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let evQuery = supabase
      .from("agenda_events" as any)
      .select("*")
      .gte("data_inicio", monthStart.toISOString())
      .lte("data_inicio", monthEnd.toISOString())
      .order("data_inicio", { ascending: true }) as any;

    if (activeCampanhaId) evQuery = evQuery.eq("campanha_id", activeCampanhaId);

    const [evRes, profRes] = await Promise.all([
      evQuery,
      supabase.from("profiles").select("id, name"),
    ]);

    setEvents((evRes.data || []) as AgendaEvent[]);
    const profs = (profRes.data || []) as Profile[];
    setProfiles(profs);
    const pMap: Record<string, Profile> = {};
    profs.forEach((p) => (pMap[p.id] = p));
    setProfileMap(pMap);
    setLoading(false);
  }, [user, activeCampanhaId, isMaster, currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ───── Calendar Grid ───── */

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    events.forEach((ev) => {
      const key = format(parseISO(ev.data_inicio), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  /* ───── Filtered list ───── */

  const filteredEvents = useMemo(() => {
    let list = selectedDate
      ? events.filter((e) => isSameDay(parseISO(e.data_inicio), selectedDate))
      : events;
    if (filterTipo !== "all") list = list.filter((e) => e.tipo === filterTipo);
    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.titulo.toLowerCase().includes(q) ||
          e.local?.toLowerCase().includes(q) ||
          e.cidade?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, selectedDate, filterTipo, filterStatus, searchTerm]);

  /* ───── CRUD ───── */

  const openCreate = (date?: Date) => {
    setEditingEvent(null);
    setForm({
      ...emptyForm,
      data_inicio: date ? format(date, "yyyy-MM-dd") : "",
    });
    setShowForm(true);
  };

  const openEdit = (ev: AgendaEvent) => {
    const start = parseISO(ev.data_inicio);
    const end = ev.data_fim ? parseISO(ev.data_fim) : null;
    setEditingEvent(ev);
    setForm({
      titulo: ev.titulo,
      descricao: ev.descricao || "",
      tipo: ev.tipo,
      data_inicio: format(start, "yyyy-MM-dd"),
      hora_inicio: format(start, "HH:mm"),
      data_fim: end ? format(end, "yyyy-MM-dd") : "",
      hora_fim: end ? format(end, "HH:mm") : "",
      local: ev.local || "",
      cidade: ev.cidade || "",
      bairro: ev.bairro || "",
      responsavel_id: ev.responsavel_id || "",
      status: ev.status,
      prioridade: ev.prioridade,
      notas: ev.notas || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCampanhaId) {
      toast({ title: "Selecione uma campanha", description: "É necessário selecionar uma campanha ativa antes de criar um evento.", variant: "destructive" });
      return;
    }
    setCreating(true);

    const dataInicio = `${form.data_inicio}T${form.hora_inicio}:00`;
    const dataFim = form.data_fim && form.hora_fim ? `${form.data_fim}T${form.hora_fim}:00` : form.data_fim ? `${form.data_fim}T23:59:00` : null;

    const payload = {
      campanha_id: activeCampanhaId,
      titulo: form.titulo,
      descricao: form.descricao || null,
      tipo: form.tipo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      local: form.local || null,
      cidade: form.cidade || null,
      bairro: form.bairro || null,
      responsavel_id: form.responsavel_id || null,
      status: form.status,
      prioridade: form.prioridade,
      notas: form.notas || null,
      ...(editingEvent ? {} : { created_by: user.id }),
    };

    const query = editingEvent
      ? (supabase.from("agenda_events" as any) as any).update(payload).eq("id", editingEvent.id)
      : (supabase.from("agenda_events" as any) as any).insert(payload);

    const { error } = await query;

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
      setShowForm(false);
      setEditingEvent(null);
      setForm(emptyForm);
      fetchData();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("agenda_events" as any) as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Evento removido" });
      fetchData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await (supabase.from("agenda_events" as any) as any).update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Status: ${STATUS_CONFIG[newStatus]?.label}` });
      fetchData();
    }
  };

  /* ───── Render helpers ───── */

  const renderEventBadge = (ev: AgendaEvent) => {
    const cfg = EVENT_TYPES[ev.tipo] || EVENT_TYPES.outro;
    const Icon = cfg.icon;
    return (
      <div key={ev.id} className={`flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5 truncate border ${cfg.color}`}>
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{ev.titulo}</span>
      </div>
    );
  };

  const renderEventCard = (ev: AgendaEvent) => {
    const cfg = EVENT_TYPES[ev.tipo] || EVENT_TYPES.outro;
    const Icon = cfg.icon;
    const stCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.confirmado;
    const priCfg = PRIORIDADE_CONFIG[ev.prioridade] || PRIORIDADE_CONFIG.normal;
    const start = parseISO(ev.data_inicio);
    const end = ev.data_fim ? parseISO(ev.data_fim) : null;
    const responsavel = ev.responsavel_id ? profileMap[ev.responsavel_id] : null;

    return (
      <Card key={ev.id} className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border ${cfg.color}`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </div>
                <Badge className={stCfg.color}>{stCfg.label}</Badge>
                {ev.prioridade === "alta" && (
                  <Badge className={priCfg.color}>
                    <AlertTriangle className="w-3 h-3 mr-1" /> Prioridade Alta
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base">{ev.titulo}</h3>
              {ev.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{ev.descricao}</p>}
              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(start, "dd/MM HH:mm", { locale: ptBR })}
                  {end && ` — ${format(end, "HH:mm")}`}
                </span>
                {(ev.local || ev.cidade) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[ev.local, ev.bairro, ev.cidade].filter(Boolean).join(", ")}
                  </span>
                )}
                {responsavel && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {responsavel.name}
                  </span>
                )}
              </div>
              {ev.notas && <p className="text-xs text-muted-foreground italic mt-1">{ev.notas}</p>}
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ev)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              {ev.status === "confirmado" && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleStatusChange(ev.id, "realizado")}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
              )}
              {ev.status !== "cancelado" && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleStatusChange(ev.id, "cancelado")}>
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ev.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ───── Loading ───── */

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="w-8 h-8 text-primary" /> Agenda da Campanha
            </h1>
            <p className="text-muted-foreground">Compromissos, eventos e atividades de campanha</p>
          </div>
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        </div>

        <Tabs value={viewTab} onValueChange={setViewTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>

          {/* ───── CALENDAR VIEW ───── */}
          <TabsContent value="calendario">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-lg capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {calendarDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayEvents = eventsByDay[key] || [];
                    const inMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const selected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setSelectedDate(day);
                            setViewTab("lista");
                          } else {
                            setSelectedDate(selected ? null : day);
                          }
                        }}
                        className={`
                          min-h-[80px] md:min-h-[100px] bg-card p-1.5 text-left flex flex-col transition-colors
                          ${!inMonth ? "opacity-40" : ""}
                          ${today ? "ring-2 ring-primary ring-inset" : ""}
                          ${selected ? "bg-accent" : "hover:bg-accent/50"}
                        `}
                      >
                        <span className={`text-xs font-medium mb-1 ${today ? "text-primary font-bold" : ""}`}>
                          {format(day, "d")}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(renderEventBadge)}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} mais</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected day events */}
            {selectedDate && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => openCreate(selectedDate)} className="gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                {filteredEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      Nenhum evento neste dia
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">{filteredEvents.map(renderEventCard)}</div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ───── LIST VIEW ───── */}
          <TabsContent value="lista">
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar evento..." />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                  <p className="text-muted-foreground mb-4">Crie seu primeiro compromisso</p>
                  <Button onClick={() => openCreate()}>Novo Evento</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">{filteredEvents.map(renderEventCard)}</div>
            )}
          </TabsContent>
        </Tabs>

        {/* ───── EVENT FORM DIALOG ───── */}
        <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditingEvent(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
              <DialogDescription>Preencha os detalhes do compromisso de campanha</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Debate na TV Câmara" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Evento *</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm((p) => ({ ...p, prioridade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Data Início *</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Hora Início</Label>
                  <Input type="time" value={form.hora_inicio} onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={form.data_fim} onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fim</Label>
                  <Input type="time" value={form.hora_fim} onChange={(e) => setForm((p) => ({ ...p, hora_fim: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes do evento..." rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} placeholder="Ex: Praça Central" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))} placeholder="Ex: Recife" />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))} placeholder="Ex: Boa Viagem" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={form.responsavel_id} onValueChange={(v) => setForm((p) => ({ ...p, responsavel_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Notas internas..." rows={2} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingEvent(null); }}>Cancelar</Button>
                <Button type="submit" disabled={creating || !form.titulo || !form.data_inicio}>
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : editingEvent ? "Salvar Alterações" : "Criar Evento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgendaPage;
