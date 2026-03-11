import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

interface AccessControlRow {
  role: string;
  route: string;
  allowed: boolean;
}

interface UserAccessControlRow {
  route: string;
  allowed: boolean;
}

export function useAccessControl() {
  const { user, userRoles, campanhaId, selectedCampanhaId, isMaster } = useAuth();
  const effectiveCampanhaId = selectedCampanhaId || campanhaId;

  const { data: rules, isLoading: isLoadingRoles } = useQuery({
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

  const { data: userRules, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-access-control', effectiveCampanhaId, user?.id],
    queryFn: async () => {
      if (!effectiveCampanhaId || !user) return [];
      const { data, error } = await supabase
        .from('user_access_control')
        .select('route, allowed')
        .eq('campanha_id', effectiveCampanhaId)
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as UserAccessControlRow[];
    },
    enabled: !!user && !!effectiveCampanhaId,
    staleTime: 30_000,
  });

  // Default denials per role when no access_control rules exist
  const DEFAULT_DENIED: Record<string, string[]> = {
    supporter: ['/budget', '/expenses', '/admin', '/roi'],
    political_leader: ['/admin', '/roi'],
    territorial_coordinator: ['/admin', '/roi'],
    local_coordinator: ['/admin', '/roi'],
    supervisor: ['/admin', '/roi'],
    assessor: ['/admin'],
  };

  const canAccess = useCallback((route: string): boolean => {
    // 1. Master always has access
    if (isMaster) return true;

    // 2. If user has no roles, allow access by default (new users)
    if (!userRoles || userRoles.length === 0) return true;

    // Normalize: try exact match first, then parent route
    const segments = route.split('/').filter(Boolean);
    const normalizedRoute = '/' + segments[0];
    const isSubRoute = segments.length > 1;

    // 3. User-level override (highest priority after master)
    if (userRules && userRules.length > 0) {
      // Check exact route first, then parent
      const userRule = userRules.find(r => r.route === route) 
        || (!isSubRoute ? userRules.find(r => r.route === normalizedRoute) : undefined);
      if (userRule) return userRule.allowed;
    }

    // 4. Role-based access_control rules
    if (rules && rules.length > 0) {
      for (const role of userRoles) {
        const rule = rules.find(r => r.role === role && r.route === route)
          || (!isSubRoute ? rules.find(r => r.role === role && r.route === normalizedRoute) : undefined);
        if (rule) {
          if (rule.allowed) return true;
          continue;
        }
        // No rule for this role+route: check default denials
        const denied = DEFAULT_DENIED[role];
        if (!denied || !denied.includes(normalizedRoute)) return true;
      }

      const hasAnyExplicitAllow = userRoles.some(role => {
        const rule = rules.find(r => r.role === role && r.route === route)
          || (!isSubRoute ? rules.find(r => r.role === role && r.route === normalizedRoute) : undefined);
        return rule?.allowed;
      });
      return hasAnyExplicitAllow;
    }

    // 5. No rules — apply default denials
    for (const role of userRoles) {
      const denied = DEFAULT_DENIED[role];
      if (!denied || !denied.includes(normalizedRoute)) return true;
    }

    return true;
  }, [rules, userRules, userRoles, isMaster]);

  return { canAccess, isLoading: isLoadingRoles || isLoadingUser };
}
