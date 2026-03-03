import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

interface AccessControlRow {
  role: string;
  route: string;
  allowed: boolean;
}

export function useAccessControl() {
  const { user, userRoles, campanhaId, selectedCampanhaId, isMaster } = useAuth();
  const effectiveCampanhaId = selectedCampanhaId || campanhaId;

  const { data: rules, isLoading } = useQuery({
    queryKey: ['access-control', effectiveCampanhaId, user?.id],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data, error } = await supabase
        .from('access_control')
        .select('role, route, allowed')
        .eq('campanha_id', effectiveCampanhaId);
      if (error) throw error;
      return (data || []) as AccessControlRow[];
    },
    enabled: !!user && !!effectiveCampanhaId,
    staleTime: 30_000,
  });

  const canAccess = useCallback((route: string): boolean => {
    // Master always has access
    if (isMaster) return true;
    // If no rules loaded yet, default allow
    if (!rules || rules.length === 0) return true;

    // Check each of the user's roles — if ANY role is allowed, grant access
    for (const role of userRoles) {
      const rule = rules.find(r => r.role === role && r.route === route);
      // No rule = default allowed
      if (!rule) return true;
      if (rule.allowed) return true;
    }

    // All roles explicitly denied
    // But if no rule matched at all (shouldn't happen after the loop), default allow
    const hasAnyRule = userRoles.some(role => rules.some(r => r.role === role && r.route === route));
    if (!hasAnyRule) return true;

    return false;
  }, [rules, userRoles, isMaster]);

  return { canAccess, isLoading };
}
