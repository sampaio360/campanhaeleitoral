import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ModuleStats {
  totalBudget: number;
  expensesCount: number;
  supportersCount: number;
  reportsCount: number;
}

/**
 * Lightweight hook that fetches only the counts needed for module cards.
 * Unlike useDashboardData, it does NOT fetch supporter coordinates,
 * audit logs, heatmap data, or active checkins.
 */
export function useModuleStats() {
  const { profile, campanhaId } = useAuth();
  const hasCandidate = !!profile?.candidate_id;

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["module-stats", campanhaId],
    queryFn: async (): Promise<ModuleStats> => {
      if (!campanhaId) {
        return { totalBudget: 0, expensesCount: 0, supportersCount: 0, reportsCount: 0 };
      }

      const [budgetsRes, expensesRes, supportersRes, reportsRes] = await Promise.all([
        supabase.from("budgets").select("total_planned", { count: "exact", head: false }).eq("campanha_id", campanhaId),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("campanha_id", campanhaId),
        supabase.from("supporters").select("id", { count: "exact", head: true }).eq("campanha_id", campanhaId),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("campanha_id", campanhaId),
      ]);

      return {
        totalBudget: budgetsRes.data?.reduce((s, b) => s + Number(b.total_planned), 0) || 0,
        expensesCount: expensesRes.count || 0,
        supportersCount: supportersRes.count || 0,
        reportsCount: reportsRes.count || 0,
      };
    },
    enabled: !!campanhaId,
    staleTime: 30_000, // 30s cache
  });

  return {
    stats: stats ?? { totalBudget: 0, expensesCount: 0, supportersCount: 0, reportsCount: 0 },
    loading,
    hasCandidate,
  };
}
