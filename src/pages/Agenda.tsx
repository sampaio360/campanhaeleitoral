import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Plus, Search } from "lucide-react";
import { isSameDay, parseISO, format } from "date-fns";

import { useAgendaData, AgendaEvent, EVENT_TYPES, STATUS_CONFIG, PRIORIDADE_CONFIG } from "@/hooks/useAgendaData";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { AgendaEventCard } from "@/components/agenda/AgendaEventCard";
import { AgendaEventForm } from "@/components/agenda/AgendaEventForm";
import { generateAgendaProtocol } from "@/components/agenda/AgendaProtocolPDF";

const AgendaPage = () => {
  const {
    events, profiles, profileMap, liderancas, campanhaInfo,
    loading, currentMonth, setCurrentMonth,
    calendarDays, eventsByDay,
    handleSubmit, handleDelete, handleStatusChange,
  } = useAgendaData();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState("calendario");
  const [formInitialDate, setFormInitialDate] = useState<Date | undefined>();

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

  /* ───── Actions ───── */
  const openCreate = (date?: Date) => {
    setEditingEvent(null);
    setFormInitialDate(date);
    setShowForm(true);
  };

  const openEdit = (ev: AgendaEvent) => {
    setEditingEvent(ev);
    setFormInitialDate(undefined);
    setShowForm(true);
  };

  const handleGenerateProtocol = (ev: AgendaEvent) => {
    const responsavel = ev.responsavel_id ? profileMap[ev.responsavel_id] : null;
    const cfg = EVENT_TYPES[ev.tipo] || EVENT_TYPES.outro;
    const stCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.confirmado;
    const priCfg = PRIORIDADE_CONFIG[ev.prioridade] || PRIORIDADE_CONFIG.normal;
    generateAgendaProtocol({
      event: ev,
      campanhaNome: campanhaInfo?.nome,
      campanhaPartido: campanhaInfo?.partido || undefined,
      responsavelNome: responsavel?.name,
      tipoLabel: cfg.label,
      statusLabel: stCfg.label,
      prioridadeLabel: priCfg.label,
    });
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
      <Tabs value={viewTab} onValueChange={setViewTab} className="container mx-auto px-4 pt-8">
        {/* Sticky Header */}
        <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
          <div className="flex items-center justify-between mb-4">
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
          <TabsList>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </div>

        {/* Calendar View */}
        <TabsContent value="calendario">
          <AgendaCalendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            calendarDays={calendarDays}
            eventsByDay={eventsByDay}
            selectedDate={selectedDate}
            onDayClick={(day, hasEvents) => {
              if (hasEvents) {
                setSelectedDate(day);
                setViewTab("lista");
              } else {
                openCreate(day);
              }
            }}
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="lista">
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
            <div className="space-y-3">
              {filteredEvents.map((ev) => (
                <AgendaEventCard
                  key={ev.id}
                  event={ev}
                  profileMap={profileMap}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onGenerateProtocol={handleGenerateProtocol}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Event Form Dialog */}
        <AgendaEventForm
          open={showForm}
          onOpenChange={(o) => { setShowForm(o); if (!o) setEditingEvent(null); }}
          editingEvent={editingEvent}
          profiles={profiles}
          liderancas={liderancas}
          onSubmit={handleSubmit}
          initialDate={formInitialDate}
        />
      </Tabs>
    </div>
  );
};

export default AgendaPage;
