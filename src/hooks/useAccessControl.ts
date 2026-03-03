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

  // Default denials per role when no access_control rules exist
  const DEFAULT_DENIED: Record<string, string[]> = {
    supporter: ['/budget', '/expenses', '/settings', '/admin', '/roi'],
    political_leader: ['/settings', '/admin', '/roi'],
    local_coordinator: ['/admin', '/roi'],
  };

  const canAccess = useCallback((route: string): boolean => {
    // Master always has access
    if (isMaster) return true;

    // Normalize route: /budget/123 -> /budget
    const normalizedRoute = '/' + route.split('/').filter(Boolean)[0];

    // Check access_control table rules first (source of truth)
    if (rules && rules.length > 0) {
      for (const role of userRoles) {
        const rule = rules.find(r => r.role === role && (r.route === route || r.route === normalizedRoute));
        if (rule) {
          if (rule.allowed) return true;
          // explicitly denied — continue checking other roles
          continue;
        }
        // No rule for this role+route: check default denials
        const denied = DEFAULT_DENIED[role];
        if (!denied || !denied.includes(normalizedRoute)) return true;
      }

      // All roles either explicitly denied or default-denied
      const hasAnyExplicitAllow = userRoles.some(role => {
        const rule = rules.find(r => r.role === role && (r.route === route || r.route === normalizedRoute));
        return rule?.allowed;
      });
      return hasAnyExplicitAllow;
    }

    // No rules in access_control — apply default denials
    for (const role of userRoles) {
      const denied = DEFAULT_DENIED[role];
      if (!denied || !denied.includes(normalizedRoute)) return true;
    }

    return false;
  }, [rules, userRoles, isMaster]);

  return { canAccess, isLoading };
}
