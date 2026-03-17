import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trophy } from "lucide-react";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { useRecurrenceAlerts, useEffectivenessRanking } from "@/components/dashboard/useDashboardAlerts";
import { Button } from "@/components/ui/button";
import { SupportersHeatmap } from "@/components/dashboard/SupportersHeatmap";
import { LeafletHeatmap } from "@/components/dashboard/LeafletHeatmap";
import { SimultaneityWidget } from "@/components/dashboard/SimultaneityWidget";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useAccessControl } from "@/hooks/useAccessControl";

const Dashboard = () => {
  const activeCampanhaId = useActiveCampanhaId();
  const { isWidgetEnabled } = useDashboardWidgets(activeCampanhaId);
  const { canAccess } = useAccessControl();
  const { stats, supporterPoints, heatmapData, activeCheckins, loading, refetch } = useDashboardData(activeCampanhaId);
  const navigate = useNavigate();

  const recurrenceAlerts = useRecurrenceAlerts(activeCampanhaId);
  const effectivenessRanking = useEffectivenessRanking(activeCampanhaId);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted rounded-lg" />)}
            </div>
            <div className="h-80 bg-muted rounded-lg" />
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
          <div className="pt-6 sm:pt-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Dossiê de Bolso</h1>
            <p className="text-sm text-muted-foreground">Visão executiva da campanha</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Recurrence Alerts */}
          {isWidgetEnabled("recurrence_alerts") && canAccess("/dashboard/alertas") && recurrenceAlerts.length > 0 && (
            <Card className="border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas de Recorrência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recurrenceAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.street_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-orange-500/5 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{alert.street_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {alert.bairro && `${alert.bairro} — `}{alert.cidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:text-right shrink-0">
                        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                          {alert.days_since}d sem visita
                        </Badge>
                        {alert.cidade && (
                          <button
                            onClick={() => navigate(`/dossie/${encodeURIComponent(alert.cidade!)}`)}
                            className="text-xs text-primary hover:underline whitespace-nowrap"
                          >
                            Ver dossiê →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Effectiveness Ranking */}
          {isWidgetEnabled("effectiveness_ranking") && canAccess("/dashboard/ranking") && effectivenessRanking.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Ranking de Efetividade por Cidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {effectivenessRanking.slice(0, 5).map((item, idx) => (
                    <div key={item.cidade} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{item.cidade}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.streets_visited} ruas • {formatCurrency(item.total_cost)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {formatCurrency(item.cost_per_street)}/rua
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaflet Map + Simultaneity Widget */}
          {((isWidgetEnabled("heatmap") && canAccess("/dashboard/heatmap")) || (isWidgetEnabled("simultaneity") && canAccess("/dashboard/simultaneidade"))) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {isWidgetEnabled("heatmap") && canAccess("/dashboard/heatmap") && (
                <div className={isWidgetEnabled("simultaneity") && canAccess("/dashboard/simultaneidade") ? "lg:col-span-2" : "lg:col-span-3"}>
                  <LeafletHeatmap data={supporterPoints} loading={false} campanhaId={activeCampanhaId} onGeocoded={refetch} />
                </div>
              )}
              {isWidgetEnabled("simultaneity") && canAccess("/dashboard/simultaneidade") && (
                <SimultaneityWidget data={activeCheckins} loading={false} />
              )}
            </div>
          )}

          {/* Supporters Heatmap */}
          {isWidgetEnabled("supporters_heatmap") && canAccess("/dashboard/heatmap-apoiadores") && (
            <SupportersHeatmap data={heatmapData} loading={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
