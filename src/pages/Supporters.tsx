import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Phone, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { SupporterForm } from "@/components/supporters/SupporterForm";

interface Supporter {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bairro: string | null;
  cidade: string | null;
  created_at: string | null;
}

const Supporters = () => {
  const { user, campanhaId, isMaster, selectedCampanhaId } = useAuth();
  const effectiveCampanhaId = isMaster ? (selectedCampanhaId || campanhaId) : campanhaId;
  const { toast } = useToast();
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    fetchSupporters();
  }, [user, effectiveCampanhaId]);

  const fetchSupporters = async () => {
    if (!user || !effectiveCampanhaId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('supporters')
        .select('id, nome, email, telefone, bairro, cidade, created_at')
        .order('created_at', { ascending: false });
      query = query.eq('campanha_id', effectiveCampanhaId);
      const { data, error } = await query;

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
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            variant="campaign"
            className="gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            {showRegisterForm ? "Fechar" : "Cadastrar Pessoa"}
          </Button>
        </div>

        {/* Estatísticas */}
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

        {/* Formulário de cadastro */}
        {showRegisterForm && (
          <SupporterForm
            onSuccess={() => {
              fetchSupporters();
              setShowRegisterForm(false);
            }}
            onCancel={() => setShowRegisterForm(false)}
          />
        )}

        {/* Lista */}
        <div className="grid gap-4">
          {supporters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece cadastrando pessoas na campanha
                </p>
                <Button onClick={() => setShowRegisterForm(true)} variant="campaign">
                  Cadastrar Primeira Pessoa
                </Button>
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
                        {supporter.created_at && (
                          <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                            {new Date(supporter.created_at).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
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
    </div>
  );
};

export default Supporters;
