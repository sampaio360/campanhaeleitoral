import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaEvent, EVENT_TYPES, WEEKDAYS } from "@/hooks/useAgendaData";
import {
  Coffee, Car, Megaphone, Handshake, Mic, Tv, Drama, Trophy,
  PartyPopper, Church, Flag, FileText, Users, Building2, MoreHorizontal,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Coffee, Car, Megaphone, Handshake, Mic, Tv, Drama, Trophy,
  PartyPopper, Church, Flag, FileText, Users, Building2, MoreHorizontal,
};

interface Props {
  currentMonth: Date;
  setCurrentMonth: (fn: (m: Date) => Date) => void;
  calendarDays: Date[];
  eventsByDay: Record<string, AgendaEvent[]>;
  selectedDate: Date | null;
  onDayClick: (day: Date, hasEvents: boolean) => void;
}

export function AgendaCalendar({ currentMonth, setCurrentMonth, calendarDays, eventsByDay, selectedDate, onDayClick }: Props) {
  return (
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
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>
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
                onClick={() => onDayClick(day, dayEvents.length > 0)}
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
                  {dayEvents.slice(0, 3).map((ev) => {
                    const cfg = EVENT_TYPES[ev.tipo] || EVENT_TYPES.outro;
                    const Icon = ICON_MAP[cfg.icon] || MoreHorizontal;
                    return (
                      <div key={ev.id} className={`flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5 truncate border ${cfg.color}`}>
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{ev.titulo}</span>
                      </div>
                    );
                  })}
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
  );
}
