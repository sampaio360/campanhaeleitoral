import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, AlertTriangle, Loader2 } from "lucide-react";

interface TeamMessage {
  id: string;
  campanha_id: string;
  sender_id: string;
  cidade: string | null;
  titulo: string;
  conteudo: string;
  prioridade: string;
  created_at: string;
}

const Messages = () => {
  const { user, isCoordinator } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", conteudo: "", cidade: "", prioridade: "normal" });

  const fetchMessages = useCallback(async () => {
    if (!activeCampanhaId) { setLoading(false); return; }
    let query = supabase
      .from("team_messages" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100) as any;
    if (activeCampanhaId) query = query.eq("campanha_id", activeCampanhaId);
    const { data, error } = await query;

    if (!error) setMessages((data as TeamMessage[]) || []);
    setLoading(false);
  }, [activeCampanhaId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCampanhaId) return;
    setSending(true);

    const { error } = await (supabase.from("team_messages" as any) as any).insert({
      campanha_id: activeCampanhaId,
      sender_id: user.id,
      titulo: form.titulo,
      conteudo: form.conteudo,
      cidade: form.cidade || null,
      prioridade: form.prioridade,
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mensagem enviada!" });
      setForm({ titulo: "", conteudo: "", cidade: "", prioridade: "normal" });
      setShowForm(false);
      fetchMessages();
    }
    setSending(false);
  };

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
            <h1 className="text-3xl font-bold">Comunicação Direta</h1>
            <p className="text-muted-foreground">Orientações do coordenador para equipes de campo</p>
          </div>
          {isCoordinator && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Send className="w-4 h-4" /> Nova Orientação
            </Button>
          )}
        </div>

        {showForm && isCoordinator && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enviar Orientação</CardTitle>
              <CardDescription>Visível para todos os membros da campanha</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input value={form.titulo} onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Foco na região sul amanhã" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cidade (filtro)</Label>
                      <Input value={form.cidade} onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Opcional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={form.prioridade} onValueChange={(v) => setForm(p => ({ ...p, prioridade: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgente">🔴 Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo *</Label>
                  <Textarea value={form.conteudo} onChange={(e) => setForm(p => ({ ...p, conteudo: e.target.value }))} placeholder="Escreva a orientação para as equipes..." rows={4} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={sending || !form.titulo || !form.conteudo}>
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enviar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sem orientações</h3>
                <p className="text-muted-foreground">Nenhuma mensagem da coordenação ainda.</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg) => (
              <Card key={msg.id} className={msg.prioridade === "urgente" ? "border-destructive/50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    {msg.prioridade === "urgente" ? (
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{msg.titulo}</h4>
                        {msg.prioridade === "urgente" && (
                          <Badge variant="destructive" className="text-xs">Urgente</Badge>
                        )}
                        {msg.cidade && (
                          <Badge variant="outline" className="text-xs">📍 {msg.cidade}</Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
