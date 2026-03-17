import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, AlertTriangle, Loader2, Inbox, SendHorizonal, Users, CheckCheck, Eye, User } from "lucide-react";
import { UserSelector } from "@/components/messages/UserSelector";
import { PushNotificationToggle } from "@/components/messages/PushNotificationToggle";

interface TeamMessage {
  id: string;
  campanha_id: string;
  sender_id: string;
  cidade: string | null;
  titulo: string;
  conteudo: string;
  prioridade: string;
  created_at: string;
  target_roles: string[] | null;
  target_cidade: string | null;
  target_user_ids: string[] | null;
}

interface MessageRead {
  message_id: string;
  read_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  admin: "Administrador",
  coordinator: "Coordenador Geral",
  assessor: "Assessor",
  territorial_coordinator: "Coordenador Territorial",
  supervisor: "Supervisor de Área",
  local_coordinator: "Coordenador Local",
  political_leader: "Liderança Política",
  supporter: "Apoiador",
};

const SELECTABLE_ROLES = ["admin", "coordinator", "assessor", "territorial_coordinator", "supervisor", "local_coordinator", "political_leader", "supporter"];

const Messages = () => {
  const { user, isCoordinator, userRoles } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [userCidade, setUserCidade] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    conteudo: "",
    prioridade: "normal",
    target_cidade: "",
    target_roles: [] as string[],
    target_user_ids: [] as string[],
  });

  const fetchMessages = useCallback(async () => {
    if (!activeCampanhaId) { setLoading(false); return; }
    const { data, error } = await (supabase
      .from("team_messages" as any)
      .select("*")
      .eq("campanha_id", activeCampanhaId)
      .order("created_at", { ascending: false })
      .limit(200) as any);

    if (!error) setMessages((data as TeamMessage[]) || []);
    setLoading(false);
  }, [activeCampanhaId]);

  const fetchReads = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase
      .from("message_reads" as any)
      .select("message_id, read_at")
      .eq("user_id", user.id) as any);

    if (data) {
      const map: Record<string, string> = {};
      (data as MessageRead[]).forEach(r => { map[r.message_id] = r.read_at; });
      setReadMap(map);
    }
  }, [user]);

  const fetchCities = useCallback(async () => {
    if (!activeCampanhaId) return;
    const { data } = await supabase
      .from("supporters")
      .select("cidade")
      .eq("campanha_id", activeCampanhaId)
      .not("cidade", "is", null);
    if (data) {
      const unique = [...new Set(data.map(d => d.cidade).filter(Boolean) as string[])].sort();
      setCities(unique);
    }
  }, [activeCampanhaId]);

  const fetchUserCidade = useCallback(async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("supporter_id")
      .eq("id", user.id)
      .single();
    if (profile?.supporter_id) {
      const { data: supporter } = await supabase
        .from("supporters")
        .select("cidade")
        .eq("id", profile.supporter_id)
        .single();
      if (supporter?.cidade) setUserCidade(supporter.cidade);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
    fetchReads();
    fetchCities();
    fetchUserCidade();
  }, [fetchMessages, fetchReads, fetchCities, fetchUserCidade]);

  const sentMessages = useMemo(() =>
    messages.filter(m => m.sender_id === user?.id),
    [messages, user?.id]
  );

  const receivedMessages = useMemo(() =>
    messages.filter(m => {
      if (m.sender_id === user?.id) return false;

      const hasTargetUsers = m.target_user_ids && m.target_user_ids.length > 0;
      const hasTargetRoles = m.target_roles && m.target_roles.length > 0;
      const hasTargetCidade = !!m.target_cidade;

      // If no targeting at all, it's for everyone
      if (!hasTargetUsers && !hasTargetRoles && !hasTargetCidade) return true;

      // If specific users are targeted, only show if current user is in the list
      if (hasTargetUsers) {
        return m.target_user_ids!.includes(user?.id || "");
      }

      // Check role and city targeting
      let matchesRole = true;
      let matchesCidade = true;

      if (hasTargetRoles) {
        matchesRole = m.target_roles!.some(role => userRoles.includes(role as any));
      }
      if (hasTargetCidade) {
        matchesCidade = userCidade?.toLowerCase() === m.target_cidade?.toLowerCase();
      }

      return matchesRole && matchesCidade;
    }),
    [messages, user?.id, userRoles, userCidade]
  );

  const unreadCount = useMemo(() =>
    receivedMessages.filter(m => !readMap[m.id]).length,
    [receivedMessages, readMap]
  );

  const handleMarkAsRead = async (messageId: string) => {
    if (!user || readMap[messageId]) return;
    setMarkingRead(messageId);

    const { error } = await (supabase.from("message_reads" as any) as any).insert({
      message_id: messageId,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setReadMap(prev => ({ ...prev, [messageId]: new Date().toISOString() }));
      toast({ title: "Mensagem marcada como lida ✓" });
    }
    setMarkingRead(null);
  };

  const handleToggleRole = (role: string) => {
    setForm(p => ({
      ...p,
      target_roles: p.target_roles.includes(role)
        ? p.target_roles.filter(r => r !== role)
        : [...p.target_roles, role],
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCampanhaId) return;
    setSending(true);

    const { error } = await (supabase.from("team_messages" as any) as any).insert({
      campanha_id: activeCampanhaId,
      sender_id: user.id,
      titulo: form.titulo,
      conteudo: form.conteudo,
      cidade: form.target_cidade || null,
      prioridade: form.prioridade,
      // When specific users are selected, ignore role/city filters
      target_roles: form.target_user_ids.length > 0 ? null : (form.target_roles.length > 0 ? form.target_roles : null),
      target_cidade: form.target_user_ids.length > 0 ? null : (form.target_cidade || null),
      target_user_ids: form.target_user_ids.length > 0 ? form.target_user_ids : null,
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mensagem enviada!" });

      // Always send Push notification
      try {
        const { data: session } = await supabase.auth.getSession();
        const res = await fetch(
          `https://mjfmthjpibbvlehgoacr.supabase.co/functions/v1/send-push`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.session?.access_token}`,
            },
            body: JSON.stringify({
              campanha_id: activeCampanhaId,
              titulo: form.titulo,
              conteudo: form.conteudo,
              target_user_ids: form.target_user_ids.length > 0 ? form.target_user_ids : null,
            }),
          }
        );
        const result = await res.json();
        toast({ title: `🔔 Push: ${result.enviados}/${result.total} notificações enviadas` });
      } catch (err) {
        console.error("Erro ao enviar push:", err);
      }

      setForm({ titulo: "", conteudo: "", prioridade: "normal", target_cidade: "", target_roles: [], target_user_ids: [] });
      setShowForm(false);
      fetchMessages();
    }
    setSending(false);
  };

  const renderTargetBadges = (msg: TeamMessage) => {
    const badges: React.ReactNode[] = [];
    if (msg.target_cidade) {
      badges.push(<Badge key="city" variant="outline" className="text-xs">📍 {msg.target_cidade}</Badge>);
    }
    if (msg.target_roles && msg.target_roles.length > 0) {
      msg.target_roles.forEach(role => {
        badges.push(
          <Badge key={role} variant="secondary" className="text-xs">
            {ROLE_LABELS[role] || role}
          </Badge>
        );
      });
    }
    if (msg.target_user_ids && msg.target_user_ids.length > 0) {
      badges.push(
        <Badge key="users" variant="secondary" className="text-xs">
          <User className="w-3 h-3 mr-1" /> {msg.target_user_ids.length} pessoa(s)
        </Badge>
      );
    }
    if (badges.length === 0) {
      badges.push(<Badge key="all" variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" /> Todos</Badge>);
    }
    return badges;
  };

  const renderMessageCard = (msg: TeamMessage, isReceived: boolean) => {
    const isRead = !!readMap[msg.id];
    const readAt = readMap[msg.id];

    return (
      <Card key={msg.id} className={`${msg.prioridade === "urgente" ? "border-destructive/50" : ""} ${isReceived && !isRead ? "border-l-4 border-l-primary bg-primary/5" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            {msg.prioridade === "urgente" ? (
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            ) : (
              <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{msg.titulo}</h4>
                {msg.prioridade === "urgente" && (
                  <Badge variant="destructive" className="text-xs">Urgente</Badge>
                )}
                {isReceived && !isRead && (
                  <Badge className="text-xs bg-primary text-primary-foreground">Nova</Badge>
                )}
                {renderTargetBadges(msg)}
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString("pt-BR")}
                </p>
                {isReceived && (
                  isRead ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                      Lida em {new Date(readAt).toLocaleString("pt-BR")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      disabled={markingRead === msg.id}
                      onClick={() => handleMarkAsRead(msg.id)}
                    >
                      {markingRead === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      Marcar como lida
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (text: string) => (
    <Card>
      <CardContent className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sem mensagens</h3>
        <p className="text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );

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
      <div className="container mx-auto px-4">
        <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pt-8">
            <div>
              <h1 className="text-3xl font-bold">Comunicação Direta</h1>
              <p className="text-muted-foreground">Orientações do coordenador para equipes de campo</p>
            </div>
            <div className="flex items-center gap-2">
              <PushNotificationToggle />
              {isCoordinator && (
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                  <Send className="w-4 h-4" /> Nova Orientação
                </Button>
              )}
            </div>
          </div>
        </div>

        {showForm && isCoordinator && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enviar Orientação</CardTitle>
              <CardDescription>Defina o público-alvo da mensagem</CardDescription>
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
                      <Select value={form.target_cidade} onValueChange={(v) => setForm(p => ({ ...p, target_cidade: v === "all" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as cidades</SelectItem>
                          {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
                  <Label>Destinatários por Função</Label>
                  <p className="text-xs text-muted-foreground">Deixe vazio para enviar a todos</p>
                  <div className="flex flex-wrap gap-3">
                    {SELECTABLE_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={form.target_roles.includes(role)}
                          onCheckedChange={() => handleToggleRole(role)}
                        />
                        <span className="text-sm">{ROLE_LABELS[role]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <UserSelector
                  selectedIds={form.target_user_ids}
                  onChange={(ids) => setForm(p => ({ ...p, target_user_ids: ids }))}
                  filterCidade={form.target_cidade}
                  filterRoles={form.target_roles}
                />

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

        <Tabs defaultValue="recebidas">
          <TabsList className="mb-4">
            <TabsTrigger value="recebidas" className="gap-1.5">
              <Inbox className="w-4 h-4" /> Recebidas
              {unreadCount > 0 && (
                <Badge className="text-xs ml-1 bg-destructive text-destructive-foreground">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enviadas" className="gap-1.5">
              <SendHorizonal className="w-4 h-4" /> Enviadas
              {sentMessages.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">{sentMessages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recebidas" className="space-y-4">
            {receivedMessages.length === 0
              ? renderEmptyState("Nenhuma mensagem recebida ainda.")
              : receivedMessages.map(m => renderMessageCard(m, true))
            }
          </TabsContent>

          <TabsContent value="enviadas" className="space-y-4">
            {sentMessages.length === 0
              ? renderEmptyState("Você ainda não enviou orientações.")
              : sentMessages.map(m => renderMessageCard(m, false))
            }
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Messages;
