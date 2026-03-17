import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Crown, Phone } from "lucide-react";
import { useIBGEMunicipios } from "@/hooks/useIBGEMunicipios";
import {
  AgendaEvent, AgendaForm, EMPTY_FORM, EVENT_TYPES, STATUS_CONFIG, PRIORIDADE_CONFIG,
  Profile, Lideranca,
} from "@/hooks/useAgendaData";
import { format, parseISO } from "date-fns";

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: AgendaEvent | null;
  profiles: Profile[];
  liderancas: Lideranca[];
  onSubmit: (form: AgendaForm, editingEvent: AgendaEvent | null) => Promise<boolean>;
  initialDate?: Date;
}

export function AgendaEventForm({ open, onOpenChange, editingEvent, profiles, liderancas, onSubmit, initialDate }: Props) {
  const ibge = useIBGEMunicipios();
  const cidadeDropdownRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);

  const getInitialForm = (): AgendaForm => {
    if (editingEvent) {
      const start = parseISO(editingEvent.data_inicio);
      return {
        titulo: editingEvent.titulo,
        descricao: editingEvent.descricao || "",
        tipo: editingEvent.tipo,
        data_inicio: format(start, "yyyy-MM-dd"),
        hora_inicio: format(start, "HH:mm"),
        local: editingEvent.local || "",
        cidade: editingEvent.cidade || "",
        responsavel_id: editingEvent.responsavel_id || "",
        status: editingEvent.status,
        prioridade: editingEvent.prioridade,
        notas: editingEvent.notas || "",
      };
    }
    return {
      ...EMPTY_FORM,
      data_inicio: initialDate ? format(initialDate, "yyyy-MM-dd") : "",
    };
  };

  const [form, setForm] = useState<AgendaForm>(getInitialForm);

  // Reset form when dialog opens/closes or editing changes
  useState(() => {
    setForm(getInitialForm());
    ibge.setQuery(editingEvent?.cidade || "");
  });

  const filteredLiderancas = useMemo(() => {
    if (!form.cidade) return [];
    const cidadeNorm = normalizar(form.cidade);
    return liderancas.filter((l) => l.cidade && normalizar(l.cidade) === cidadeNorm);
  }, [form.cidade, liderancas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const ok = await onSubmit(form, editingEvent);
    if (ok) {
      setForm(EMPTY_FORM);
      onOpenChange(false);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={form.hora_inicio} onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes do evento..." rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Local</Label>
              <Input value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} placeholder="Ex: Praça Central" />
            </div>
            <div className="space-y-2 relative">
              <Label>Cidade</Label>
              <Input
                value={ibge.query}
                onChange={(e) => {
                  ibge.setQuery(e.target.value);
                  setForm((p) => ({ ...p, cidade: e.target.value }));
                }}
                placeholder="Digite para buscar..."
              />
              {ibge.isOpen && (
                <div ref={cidadeDropdownRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {ibge.suggestions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setForm((p) => ({ ...p, cidade: m.nome }));
                        ibge.setQuery(`${m.nome} - ${m.uf}`);
                        ibge.close();
                      }}
                    >
                      {m.nome} <span className="text-muted-foreground">- {m.uf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredLiderancas.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Crown className="w-4 h-4" />
                Lideranças Políticas {form.cidade && <span className="normal-case font-normal">em {form.cidade}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredLiderancas.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.nome}</p>
                      <p className="text-xs text-muted-foreground">{l.funcao_politica || "—"}</p>
                    </div>
                    {l.telefone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {l.telefone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={creating || !form.titulo || !form.data_inicio}>
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : editingEvent ? "Salvar Alterações" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
