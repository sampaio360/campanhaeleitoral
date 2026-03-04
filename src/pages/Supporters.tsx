import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Phone, Mail, MapPin, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { SupporterForm, SupporterEditData } from "@/components/supporters/SupporterForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
        .select('id, nome, email, telefone, bairro, cidade, estado, endereco, cep, cpf, funcao_politica, observacao, foto_url, created_at')
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
          <Button
            onClick={() => { setEditingSupporter(null); setShowForm(!showForm); }}
            variant="campaign"
            className="gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            {showForm && !editingSupporter ? "Fechar" : "Cadastrar Pessoa"}
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{supporters.length}</h3>
                <p className="text-muted-foreground">Total de pessoas cadastradas</p>
              </div>
            </div>
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
          {supporters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa encontrada</h3>
                <p className="text-muted-foreground mb-4">Comece cadastrando pessoas na campanha</p>
                <Button onClick={() => setShowForm(true)} variant="campaign">Cadastrar Primeira Pessoa</Button>
              </CardContent>
            </Card>
          ) : (
            supporters.map((supporter) => (
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
                        <h4 className="font-semibold text-sm sm:text-base truncate">{supporter.nome}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {supporter.created_at && (
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                              {new Date(supporter.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
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
