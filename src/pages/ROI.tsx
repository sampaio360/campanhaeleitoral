import { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Target, Upload } from "lucide-react";
import VotesImport from "@/components/roi/VotesImport";

interface CityROI {
  cidade: string;
  votos: number;
  investimento: number;
  custoPorVoto: number;
}

const ROI = () => {
  const { profile } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const [cityData, setCityData] = useState<CityROI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const candidateId = profile?.candidate_id;

  const fetchROI = useCallback(async () => {
    if (!activeCampanhaId || !candidateId) { setLoading(false); return; }

    // Fetch expenses by city, votes, and approved resource requests
    const [expensesRes, resourcesRes, votesRes] = await Promise.all([
      supabase.from("expenses").select("amount, category").eq("campanha_id", activeCampanhaId),
      (supabase.from("resource_requests" as any).select("valor_estimado, cidade, status").eq("campanha_id", activeCampanhaId).eq("status", "aprovado") as any),
      supabase.from("street_checkins").select("streets(cidade)").eq("campanha_id", activeCampanhaId),
    ]);

    // Aggregate expenses — expenses don't have a city column, so total them
    const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Aggregate resources by city
    const resourcesByCity: Record<string, number> = {};
    for (const r of (resourcesRes.data || []) as any[]) {
      const city = r.cidade || "Sem cidade";
      resourcesByCity[city] = (resourcesByCity[city] || 0) + Number(r.valor_estimado);
    }

    // Count checkins by city as a proxy for activity
    const checkinsByCity: Record<string, number> = {};
    for (const c of (votesRes.data || []) as any[]) {
      const city = c.streets?.cidade || "Sem cidade";
      checkinsByCity[city] = (checkinsByCity[city] || 0) + 1;
    }

    // Get actual votes
    const { data: votesAgg } = await supabase.from("votes_agg").select("total_votes").eq("candidate_id", candidateId);
    const totalVotes = (votesAgg || []).reduce((sum, v) => sum + v.total_votes, 0);

    // Build city-level data from resources (primary city source)
    const allCities = new Set([...Object.keys(resourcesByCity), ...Object.keys(checkinsByCity)]);
    const totalResources = Object.values(resourcesByCity).reduce((a, b) => a + b, 0);
    const totalInvest = totalExpenses + totalResources;

    const result: CityROI[] = [];
    for (const cidade of allCities) {
      const cityInvest = (resourcesByCity[cidade] || 0) + (allCities.size > 0 ? totalExpenses / allCities.size : 0);
      const cityCheckins = checkinsByCity[cidade] || 0;
      // Distribute votes proportionally by checkin activity
      const totalCheckins = Object.values(checkinsByCity).reduce((a, b) => a + b, 0);
      const cityVotes = totalCheckins > 0 ? Math.round((cityCheckins / totalCheckins) * totalVotes) : 0;
      const cpv = cityVotes > 0 ? cityInvest / cityVotes : 0;

      result.push({ cidade, votos: cityVotes, investimento: cityInvest, custoPorVoto: cpv });
    }

    result.sort((a, b) => a.custoPorVoto - b.custoPorVoto);
    setCityData(result);
    setLoading(false);
  }, [activeCampanhaId, candidateId]);

  useEffect(() => { fetchROI(); }, [fetchROI]);

  const totals = useMemo(() => {
    const votos = cityData.reduce((s, c) => s + c.votos, 0);
    const invest = cityData.reduce((s, c) => s + c.investimento, 0);
    return { votos, invest, cpv: votos > 0 ? invest / votos : 0 };
  }, [cityData]);

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

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
            <h1 className="text-3xl font-bold">ROI Político</h1>
            <p className="text-muted-foreground">Custo por voto e eficiência de investimento por cidade</p>
          </div>
          {candidateId && (
            <Button variant="outline" className="gap-2" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4" /> Importar Votos
            </Button>
          )}
        </div>

        {candidateId && (
          <VotesImport open={showImport} onOpenChange={setShowImport} candidateId={candidateId} />
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Votos Totais</p>
                <p className="text-2xl font-bold">{totals.votos.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.invest)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo por Voto</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.cpv)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {cityData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Investimento vs. Votos por Cidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cidade" fontSize={12} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value: number, name: string) => name === "investimento" ? formatCurrency(value) : value.toLocaleString("pt-BR")} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="investimento" name="Investimento (R$)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="votos" name="Votos" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Eficiência</CardTitle>
            <CardDescription>Cidades ordenadas por custo por voto (menor = mais eficiente)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Cidade</th>
                    <th className="text-right py-3 px-2">Votos</th>
                    <th className="text-right py-3 px-2">Investimento</th>
                    <th className="text-right py-3 px-2">Custo/Voto</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cityData.map((c, i) => {
                    const median = totals.cpv;
                    const isEfficient = c.custoPorVoto <= median && c.custoPorVoto > 0;
                    return (
                      <tr key={c.cidade} className="border-b last:border-0">
                        <td className="py-3 px-2 font-medium">{c.cidade}</td>
                        <td className="py-3 px-2 text-right">{c.votos.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(c.investimento)}</td>
                        <td className="py-3 px-2 text-right font-semibold">{c.custoPorVoto > 0 ? formatCurrency(c.custoPorVoto) : "—"}</td>
                        <td className="py-3 px-2 text-center">
                          {c.votos === 0 ? (
                            <Badge variant="outline">Sem dados</Badge>
                          ) : isEfficient ? (
                            <Badge className="bg-green-500/10 text-green-700">Eficiente</Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-700">Alto custo</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ROI;
