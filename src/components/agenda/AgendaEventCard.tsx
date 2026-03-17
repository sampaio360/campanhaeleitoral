import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, MapPin, User, AlertTriangle, CheckCircle, XCircle,
  Edit, Trash2, Printer,
  Coffee, Car, Megaphone, Handshake, Mic, Tv, Drama, Trophy,
  PartyPopper, Church, Flag, FileText, Users, Building2, MoreHorizontal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaEvent, EVENT_TYPES, STATUS_CONFIG, PRIORIDADE_CONFIG, Profile } from "@/hooks/useAgendaData";

const ICON_MAP: Record<string, any> = {
  Coffee, Car, Megaphone, Handshake, Mic, Tv, Drama, Trophy,
  PartyPopper, Church, Flag, FileText, Users, Building2, MoreHorizontal,
};

interface Props {
  event: AgendaEvent;
  profileMap: Record<string, Profile>;
  onEdit: (ev: AgendaEvent) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onGenerateProtocol: (ev: AgendaEvent) => void;
}

export function AgendaEventCard({ event: ev, profileMap, onEdit, onDelete, onStatusChange, onGenerateProtocol }: Props) {
  const cfg = EVENT_TYPES[ev.tipo] || EVENT_TYPES.outro;
  const Icon = ICON_MAP[cfg.icon] || MoreHorizontal;
  const stCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.confirmado;
  const priCfg = PRIORIDADE_CONFIG[ev.prioridade] || PRIORIDADE_CONFIG.normal;
  const start = parseISO(ev.data_inicio);
  const end = ev.data_fim ? parseISO(ev.data_fim) : null;
  const responsavel = ev.responsavel_id ? profileMap[ev.responsavel_id] : null;

  return (
    <Card className="group hover:shadow-md transition-shadow">
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
            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Gerar Protocolo PDF" onClick={() => onGenerateProtocol(ev)}>
              <Printer className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(ev)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            {ev.status === "confirmado" && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => onStatusChange(ev.id, "realizado")}>
                <CheckCircle className="w-3.5 h-3.5" />
              </Button>
            )}
            {ev.status !== "cancelado" && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onStatusChange(ev.id, "cancelado")}>
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(ev.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
