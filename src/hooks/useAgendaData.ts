import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, parseISO, format, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIBGEMunicipios } from "@/hooks/useIBGEMunicipios";

/* ───── Types ───── */

export interface AgendaEvent {
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

export interface Profile {
  id: string;
  name: string;
}

export interface Lideranca {
  id: string;
  nome: string;
  funcao_politica: string | null;
  telefone: string | null;
  cidade: string | null;
}

/* ───── Config ───── */

export const EVENT_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  cafe_com_liderancas: { label: "Café com Lideranças", icon: "Coffee", color: "bg-yellow-500/10 text-yellow-800 border-yellow-200" },
  carreata: { label: "Carreata", icon: "Car", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  comicio: { label: "Comício", icon: "Megaphone", color: "bg-red-500/10 text-red-700 border-red-200" },
  corpo_a_corpo: { label: "Corpo a Corpo", icon: "Handshake", color: "bg-teal-500/10 text-teal-700 border-teal-200" },
  debate: { label: "Debate", icon: "Mic", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  entrevista: { label: "Entrevista / Mídia", icon: "Tv", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  evento_cultural: { label: "Evento Cultural", icon: "Drama", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
  evento_esportivo: { label: "Evento Esportivo", icon: "Trophy", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  evento_partidario: { label: "Evento Partidário", icon: "PartyPopper", color: "bg-pink-500/10 text-pink-700 border-pink-200" },
  evento_religioso: { label: "Evento Religioso", icon: "Church", color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  inauguracao: { label: "Inauguração de Comitê", icon: "Flag", color: "bg-green-500/10 text-green-700 border-green-200" },
  panfletagem: { label: "Panfletagem", icon: "FileText", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  reuniao: { label: "Reunião", icon: "Users", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  visita_institucional: { label: "Visita Institucional", icon: "Building2", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
  outro: { label: "Outro", icon: "MoreHorizontal", color: "bg-muted text-muted-foreground border-border" },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmado: { label: "Confirmado", color: "bg-green-500/10 text-green-700" },
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
  realizado: { label: "Realizado", color: "bg-blue-500/10 text-blue-700" },
};

export const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
  baixa: { label: "Baixa", color: "bg-accent text-accent-foreground" },
};

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const EMPTY_FORM = {
  titulo: "", descricao: "", tipo: "reuniao", data_inicio: "", hora_inicio: "09:00",
  local: "", cidade: "",
  responsavel_id: "", status: "confirmado", prioridade: "normal", notas: "",
};

export type AgendaForm = typeof EMPTY_FORM;

/* ───── Hook ───── */

export function useAgendaData() {
  const { user, isMaster } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const queryKey = ["agenda-events", activeCampanhaId, format(currentMonth, "yyyy-MM")];

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      let evQuery = supabase
        .from("agenda_events" as any)
        .select("*")
        .gte("data_inicio", monthStart.toISOString())
        .lte("data_inicio", monthEnd.toISOString())
        .order("data_inicio", { ascending: true }) as any;
      if (activeCampanhaId) evQuery = evQuery.eq("campanha_id", activeCampanhaId);

      let liderQuery = supabase
        .from("supporters")
        .select("id, nome, funcao_politica, telefone, cidade") as any;
      liderQuery = liderQuery.eq("lideranca_politica", true);
      if (activeCampanhaId) liderQuery = liderQuery.eq("campanha_id", activeCampanhaId);

      let profQuery = supabase.from("profiles").select("id, name") as any;
      if (activeCampanhaId) profQuery = profQuery.eq("campanha_id", activeCampanhaId);

      const campanhaQuery = activeCampanhaId
        ? supabase.from("campanhas").select("nome, partido").eq("id", activeCampanhaId).single()
        : null;

      const [evRes, profRes, liderRes, campanhaRes] = await Promise.all([
        evQuery, profQuery, liderQuery, campanhaQuery,
      ]);

      const profs = (profRes.data || []) as Profile[];
      const pMap: Record<string, Profile> = {};
      profs.forEach((p) => (pMap[p.id] = p));

      return {
        events: (evRes.data || []) as AgendaEvent[],
        profiles: profs,
        profileMap: pMap,
        liderancas: (liderRes.data || []) as Lideranca[],
        campanhaInfo: campanhaRes?.data as { nome: string; partido: string | null } | null,
      };
    },
    enabled: !!user && (!!activeCampanhaId || isMaster),
  });

  const events = data?.events || [];
  const profiles = data?.profiles || [];
  const profileMap = data?.profileMap || {};
  const liderancas = data?.liderancas || [];
  const campanhaInfo = data?.campanhaInfo || null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["agenda-events"] });

  const handleSubmit = async (form: AgendaForm, editingEvent: AgendaEvent | null) => {
    if (!user || !activeCampanhaId) {
      toast({ title: "Selecione uma campanha", variant: "destructive" });
      return false;
    }
    const dataInicio = `${form.data_inicio}T${form.hora_inicio}:00`;
    const payload = {
      campanha_id: activeCampanhaId,
      titulo: form.titulo,
      descricao: form.descricao || null,
      tipo: form.tipo,
      data_inicio: dataInicio,
      data_fim: null,
      local: form.local || null,
      cidade: form.cidade || null,
      bairro: null,
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
      return false;
    }
    toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
    invalidate();
    return true;
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("agenda_events" as any) as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Evento removido" });
      invalidate();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await (supabase.from("agenda_events" as any) as any).update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Status: ${STATUS_CONFIG[newStatus]?.label}` });
      invalidate();
    }
  };

  // Calendar grid
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

  return {
    events, profiles, profileMap, liderancas, campanhaInfo,
    loading, currentMonth, setCurrentMonth,
    calendarDays, eventsByDay,
    handleSubmit, handleDelete, handleStatusChange,
  };
}
