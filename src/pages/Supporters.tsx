import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Phone, Mail, MapPin, Pencil, Trash2, Link2, Search, Printer, Filter, X, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { SupporterForm, SupporterEditData } from "@/components/supporters/SupporterForm";
import { generateSupportersReport } from "@/components/supporters/SupportersReportPDF";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileDataCard } from "@/components/profile/ProfileDataCard";

interface Supporter {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  cep: string | null;
  cpf: string | null;
  funcao_politica: string | null;
  lideranca_politica: boolean;
  observacao: string | null;
  foto_url: string | null;
  created_at: string | null;
}

const Supporters = () => {
  const { user } = useAuth();
  const effectiveCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<SupporterEditData | null>(null);
  const [deletingSupporter, setDeletingSupporter] = useState<Supporter | null>(null);
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCidade, setFilterCidade] = useState("all");
  const [filterBairro, setFilterBairro] = useState("all");
  const [filterLideranca, setFilterLideranca] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const BASE_URL = "https://www.gerencialcampanha.com.br";

  const { data: inviteToken } = useQuery({
    queryKey: ["invite-link-for-supporters", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return null;
      const { data } = await supabase
        .from("invite_links")
        .select("token")
        .eq("campanha_id", effectiveCampanhaId)
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.token ?? null;
    },
    enabled: !!effectiveCampanhaId,
  });

  const { data: formEnabled } = useQuery({
    queryKey: ["external-form-enabled", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return false;
      const { data } = await supabase
        .from("external_form_config")
        .select("enabled")
        .eq("campanha_id", effectiveCampanhaId)
        .maybeSingle();
      return data?.enabled ?? false;
    },
    enabled: !!effectiveCampanhaId,
  });

  const { data: campanhaInfo } = useQuery({
    queryKey: ["campanha-info-supporters", effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return null;
      const { data } = await supabase
        .from("campanhas")
        .select("nome, partido")
        .eq("id", effectiveCampanhaId)
        .single();
      return data as { nome: string; partido: string | null } | null;
    },
    enabled: !!effectiveCampanhaId,
  });

  const copyExternalLink = () => {
    if (!inviteToken) return;
    const url = `${BASE_URL}/cadastro/${inviteToken}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  useEffect(() => {
    fetchSupporters();
  }, [user, effectiveCampanhaId]);

  const fetchSupporters = async () => {
    if (!user || !effectiveCampanhaId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('supporters')
        .select('id, nome, email, telefone, bairro, cidade, estado, endereco, cep, cpf, funcao_politica, lideranca_politica, observacao, foto_url, created_at')
        .eq('campanha_id', effectiveCampanhaId)
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar apoiadores", description: error.message, variant: "destructive" });
        return;
      }
      setSupporters(data || []);
    } catch (error) {
      console.error('Error fetching supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived filter options
  const cidadeOptions = useMemo(() => {
    const set = new Set(supporters.map((s) => s.cidade).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [supporters]);

  const bairroOptions = useMemo(() => {
    let filtered = supporters;
    if (filterCidade !== "all") filtered = filtered.filter((s) => s.cidade === filterCidade);
    const set = new Set(filtered.map((s) => s.bairro).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [supporters, filterCidade]);

  // Filtered list
  const filteredSupporters = useMemo(() => {
    let list = supporters;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.nome.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.telefone?.includes(q) ||
          s.cpf?.includes(q)
      );
    }
    if (filterCidade !== "all") list = list.filter((s) => s.cidade === filterCidade);
    if (filterBairro !== "all") list = list.filter((s) => s.bairro === filterBairro);
    if (filterLideranca === "true") list = list.filter((s) => s.lideranca_politica);
    if (filterLideranca === "false") list = list.filter((s) => !s.lideranca_politica);
    return list;
  }, [supporters, searchTerm, filterCidade, filterBairro, filterLideranca]);

  const hasActiveFilters = filterCidade !== "all" || filterBairro !== "all" || filterLideranca !== "all" || searchTerm !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCidade("all");
    setFilterBairro("all");
    setFilterLideranca("all");
  };

  const handleEdit = (supporter: Supporter) => {
    setEditingSupporter(supporter);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingSupporter) return;
    try {
      const { error } = await supabase.from('supporters').delete().eq('id', deletingSupporter.id);
      if (error) throw error;
      toast({ title: "Pessoa excluída com sucesso" });
      fetchSupporters();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletingSupporter(null);
    }
  };

  const handleFormSuccess = () => {
    fetchSupporters();
    setShowForm(false);
    setEditingSupporter(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSupporter(null);
  };

  const handleGenerateReport = () => {
    generateSupportersReport({
      supporters: filteredSupporters,
      campanhaNome: campanhaInfo?.nome,
      campanhaPartido: campanhaInfo?.partido || undefined,
      filters: {
        search: searchTerm || undefined,
        cidade: filterCidade !== "all" ? filterCidade : undefined,
        bairro: filterBairro !== "all" ? filterBairro : undefined,
        lideranca: filterLideranca !== "all" ? filterLideranca : undefined,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Pessoas</h1>
            <p className="text-sm text-muted-foreground">Gerencie as pessoas vinculadas à campanha</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {formEnabled && inviteToken && (
              <Button onClick={copyExternalLink} variant="outline" className="gap-2 w-full sm:w-auto">
                <Link2 className="w-4 h-4" />
                Copiar Link de Cadastro
              </Button>
            )}
            <Button onClick={handleGenerateReport} variant="outline" className="gap-2 w-full sm:w-auto" disabled={filteredSupporters.length === 0}>
              <Printer className="w-4 h-4" />
              Relatório PDF
            </Button>
            <Button
              onClick={() => { setEditingSupporter(null); setShowForm(!showForm); }}
              variant="campaign"
              className="gap-2 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              {showForm && !editingSupporter ? "Fechar" : "Cadastrar Pessoa"}
            </Button>
          </div>
        </div>

        {/* Stats + Search + Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{filteredSupporters.length}</h3>
                <p className="text-muted-foreground text-sm">
                  {hasActiveFilters ? `de ${supporters.length} pessoas` : "Total de pessoas cadastradas"}
                </p>
              </div>
            </div>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail, telefone ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant={hasActiveFilters ? "default" : "outline"} size="icon" className="shrink-0">
                    <Filter className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 space-y-3" align="end">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Filtros</span>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                        <X className="w-3 h-3" /> Limpar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                    <Select value={filterCidade} onValueChange={(v) => { setFilterCidade(v); setFilterBairro("all"); }}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {cidadeOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Bairro</label>
                    <Select value={filterBairro} onValueChange={setFilterBairro}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {bairroOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Liderança</label>
                    <Select value={filterLideranca} onValueChange={setFilterLideranca}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Apenas Lideranças</SelectItem>
                        <SelectItem value="false">Sem Lideranças</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5">
                {filterCidade !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    Cidade: {filterCidade}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterCidade("all"); setFilterBairro("all"); }} />
                  </Badge>
                )}
                {filterBairro !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    Bairro: {filterBairro}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterBairro("all")} />
                  </Badge>
                )}
                {filterLideranca !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    {filterLideranca === "true" ? "Lideranças" : "Sem lideranças"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterLideranca("all")} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <SupporterForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editData={editingSupporter}
          />
        )}

        <div className="grid gap-4">
          {filteredSupporters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasActiveFilters ? "Nenhuma pessoa encontrada com esses filtros" : "Nenhuma pessoa encontrada"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? "Tente ajustar os filtros" : "Comece cadastrando pessoas na campanha"}
                </p>
                {hasActiveFilters ? (
                  <Button onClick={clearFilters} variant="outline">Limpar Filtros</Button>
                ) : (
                  <Button onClick={() => setShowForm(true)} variant="campaign">Cadastrar Primeira Pessoa</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredSupporters.map((supporter) => (
              <Card key={supporter.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                        {supporter.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{supporter.nome}</h4>
                          {supporter.lideranca_politica && (
                            <Badge variant="default" className="text-[10px] shrink-0 bg-amber-500 hover:bg-amber-600">Liderança</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {supporter.created_at && (
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                              {new Date(supporter.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingSupporter(supporter)} title="Ver perfil">
                             <Eye className="w-3.5 h-3.5" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(supporter)}>
                             <Pencil className="w-3.5 h-3.5" />
                           </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingSupporter(supporter)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                        {supporter.telefone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{supporter.telefone}</span>
                        )}
                        {supporter.email && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail className="w-3 h-3" />{supporter.email}</span>
                        )}
                        {(supporter.bairro || supporter.cidade) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[supporter.bairro, supporter.cidade].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!viewingSupporter} onOpenChange={(open) => { if (!open) setViewingSupporter(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingSupporter?.nome}</DialogTitle>
          </DialogHeader>
          <ProfileDataCard supporter={viewingSupporter} userEmail={null} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingSupporter} onOpenChange={(open) => { if (!open) setDeletingSupporter(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pessoa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingSupporter?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Supporters;
