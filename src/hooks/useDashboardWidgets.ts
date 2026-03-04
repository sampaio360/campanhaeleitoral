import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DASHBOARD_WIDGETS = [
  { key: "recurrence_alerts", label: "Alertas de Recorrência", description: "Ruas sem visita há muito tempo" },
  { key: "effectiveness_ranking", label: "Ranking de Efetividade", description: "Custo por rua visitada por cidade" },
  { key: "heatmap", label: "Mapa de Calor", description: "Mapa térmico dos apoiadores" },
  { key: "simultaneity", label: "Simultaneidade", description: "Check-ins ativos em tempo real" },
  { key: "supporters_heatmap", label: "Heatmap Apoiadores", description: "Tabela de distribuição por bairro/cidade" },
] as const;

export type WidgetKey = (typeof DASHBOARD_WIDGETS)[number]["key"];

export function useDashboardWidgets(campanhaId: string | null | undefined) {
  const queryClient = useQueryClient();

  const { data: config = [], isLoading } = useQuery({
    queryKey: ["dashboard-widget-config", campanhaId],
    queryFn: async () => {
      if (!campanhaId) return [];
      const { data, error } = await supabase
        .from("dashboard_widget_config")
        .select("widget_key, enabled")
        .eq("campanha_id", campanhaId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!campanhaId,
  });

  const isWidgetEnabled = (key: WidgetKey): boolean => {
    const found = config.find((c) => c.widget_key === key);
    return found ? found.enabled : true; // default: enabled
  };

  const toggleWidget = useMutation({
    mutationFn: async ({ key, enabled }: { key: WidgetKey; enabled: boolean }) => {
      if (!campanhaId) throw new Error("No campanha");
      const { error } = await supabase
        .from("dashboard_widget_config")
        .upsert(
          { campanha_id: campanhaId, widget_key: key, enabled, updated_at: new Date().toISOString() },
          { onConflict: "campanha_id,widget_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widget-config", campanhaId] });
    },
  });

  return { isWidgetEnabled, toggleWidget, isLoading };
}
