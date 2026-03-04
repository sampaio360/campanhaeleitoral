import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { MapPin, Users, MessageSquare, ArrowLeft, TrendingUp } from "lucide-react";

interface DossieData {
  totalStreets: number;
  visitedStreets: number;
  feedbacks: Array<{
    id: string;
    street_name: string;
    feedback_clima: string | null;
    feedback_demandas: string | null;
    liderancas_identificadas: string | null;
    ended_at: string | null;
  }>;
  demandas: Record<string, number>;
  liderancas: string[];
}

const CLIMA_LABELS: Record<string, { label: string; emoji: string }> = {
  receptivo: { label: "Receptivo", emoji: "😊" },
  neutro: { label: "Neutro", emoji: "😐" },
  hostil: { label: "Hostil", emoji: "😠" },
};

const DossieVisita = () => {
  const { cidade } = useParams<{ cidade: string }>();
  const { campanhaId, selectedCampanhaId, isMaster } = useAuth();
  const activeCampanhaId = selectedCampanhaId || campanhaId;
  const navigate = useNavigate();
  const [data, setData] = useState<DossieData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDossie = useCallback(async () => {
    if (!activeCampanhaId || !cidade) { setLoading(false); return; }

    try {
      const decodedCidade = decodeURIComponent(cidade);

      // Fetch streets for this city
      const { data: streetsData } = await supabase
        .from("streets")
        .select("id, nome, status_cobertura")
        .eq("campanha_id", activeCampanhaId)
        .eq("cidade", decodedCidade);

      const streetIds = (streetsData || []).map(s => s.id);
      const totalStreets = streetIds.length;
      const visitedStreets = (streetsData || []).filter(s => (s as any).status_cobertura !== "nao_visitada").length;

      // Fetch checkins with feedback for these streets
      let feedbacks: DossieData["feedbacks"] = [];
      if (streetIds.length > 0) {
        const { data: checkinsData } = await supabase
          .from("street_checkins")
          .select("id, feedback_clima, feedback_demandas, liderancas_identificadas, ended_at, street_id")
          .eq("campanha_id", activeCampanhaId)
          .eq("status", "completed")
          .in("street_id", streetIds)
          .order("ended_at", { ascending: false })
          .limit(50);

        const streetMap = Object.fromEntries((streetsData || []).map(s => [s.id, s.nome]));

        feedbacks = ((checkinsData as any[]) || []).map(c => ({
          id: c.id,
          street_name: streetMap[c.street_id] || "Rua",
          feedback_clima: c.feedback_clima,
          feedback_demandas: c.feedback_demandas,
          liderancas_identificadas: c.liderancas_identificadas,
          ended_at: c.ended_at,
        }));
      }

      // Extract demandas frequency
      const demandas: Record<string, number> = {};
      feedbacks.forEach(f => {
        if (f.feedback_demandas) {
          const words = f.feedback_demandas.split(/[,;.\n]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
          words.forEach(w => { demandas[w] = (demandas[w] || 0) + 1; });
        }
      });

      // Extract lideranças
      const liderancasSet = new Set<string>();
      feedbacks.forEach(f => {
        if (f.liderancas_identificadas) {
          f.liderancas_identificadas.split(/[,;\n]+/).map(l => l.trim()).filter(Boolean).forEach(l => liderancasSet.add(l));
        }
      });

      setData({
        totalStreets,
        visitedStreets,
        feedbacks,
        demandas,
        liderancas: Array.from(liderancasSet),
      });
    } catch (err) {
      console.error("Erro ao carregar dossiê:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCampanhaId, cidade]);

  useEffect(() => { fetchDossie(); }, [fetchDossie]);

  const coveragePercent = data ? (data.totalStreets > 0 ? Math.round((data.visitedStreets / data.totalStreets) * 100) : 0) : 0;
  const sortedDemandas = data ? Object.entries(data.demandas).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
  const decodedCidade = cidade ? decodeURIComponent(cidade) : "";

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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dossiê: {decodedCidade}</h1>
            <p className="text-muted-foreground">Inteligência compilada da cobertura territorial</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" /> Ruas Cadastradas
              </div>
              <p className="text-2xl font-bold">{data?.totalStreets || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" /> Cobertura
              </div>
              <p className="text-2xl font-bold">{coveragePercent}%</p>
              <Progress value={coveragePercent} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" /> Feedbacks
              </div>
              <p className="text-2xl font-bold">{data?.feedbacks.filter(f => f.feedback_clima).length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" /> Lideranças
              </div>
              <p className="text-2xl font-bold">{data?.liderancas.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Demandas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demandas Mais Citadas</CardTitle>
              <CardDescription>Palavras-chave extraídas dos feedbacks</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedDemandas.length > 0 ? (
                <div className="space-y-2">
                  {sortedDemandas.map(([term, count]) => (
                    <div key={term} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="capitalize font-medium text-sm">{term}</span>
                      <Badge variant="secondary">{count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma demanda registrada</p>
              )}
            </CardContent>
          </Card>

          {/* Lideranças */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lideranças Identificadas</CardTitle>
              <CardDescription>Nomes coletados durante as visitas</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.liderancas && data.liderancas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.liderancas.map((name) => (
                    <Badge key={name} variant="outline" className="text-sm py-1 px-3">
                      <Users className="w-3 h-3 mr-1" />
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma liderança identificada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedbacks */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Últimos Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.feedbacks && data.feedbacks.length > 0 ? (
              <div className="space-y-3">
                {data.feedbacks.filter(f => f.feedback_clima || f.feedback_demandas).slice(0, 15).map((f) => {
                  const clima = CLIMA_LABELS[f.feedback_clima || ""] || null;
                  return (
                    <div key={f.id} className="p-4 bg-muted/20 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{f.street_name}</span>
                        <div className="flex items-center gap-2">
                          {clima && (
                            <Badge variant="outline" className="text-xs">
                              {clima.emoji} {clima.label}
                            </Badge>
                          )}
                          {f.ended_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(f.ended_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      {f.feedback_demandas && (
                        <p className="text-sm text-muted-foreground">{f.feedback_demandas}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum feedback com dados registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DossieVisita;
