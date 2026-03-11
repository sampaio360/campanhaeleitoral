import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, UserCog, ChevronRight, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTE_REGISTRY, RouteEntry } from "@/lib/routeRegistry";
import { cn } from "@/lib/utils";

// --- Types ---
interface UserAccessRow {
  id: string;
  user_id: string;
  route: string;
  allowed: boolean;
}

interface ProfileOption {
  id: string;
  name: string;
  email: string | null;
  parent_id: string | null;
}

interface AccessControlRow {
  role: string;
  route: string;
  allowed: boolean;
}

// Default denials (mirrors useAccessControl.ts)
const DEFAULT_DENIED: Record<string, string[]> = {
  supporter: ['/budget', '/expenses', '/settings', '/admin', '/roi'],
  political_leader: ['/settings', '/admin', '/roi'],
  territorial_coordinator: ['/admin', '/roi'],
  local_coordinator: ['/admin', '/roi'],
  supervisor: ['/admin', '/roi'],
  assessor: ['/admin'],
};

// --- Helper: resolve effective access for a user ---
function resolveEffectiveAccess(
  route: string,
  userRules: UserAccessRow[],
  roleRules: AccessControlRow[],
  userRoles: string[],
  isMaster: boolean,
): boolean {
  if (isMaster) return true;

  const normalized = '/' + route.split('/').filter(Boolean)[0];

  // User-level override
  const userRule = userRules.find(r => r.route === route || r.route === normalized);
  if (userRule) return userRule.allowed;

  // Role-based rules
  if (roleRules.length > 0) {
    for (const role of userRoles) {
      const rule = roleRules.find(r => r.role === role && (r.route === route || r.route === normalized));
      if (rule) {
        if (rule.allowed) return true;
        continue;
      }
      const denied = DEFAULT_DENIED[role];
      if (!denied || !denied.includes(normalized)) return true;
    }
    return userRoles.some(role => {
      const rule = roleRules.find(r => r.role === role && (r.route === route || r.route === normalized));
      return rule?.allowed;
    });
  }

  // No rules — default denials
  for (const role of userRoles) {
    const denied = DEFAULT_DENIED[role];
    if (!denied || !denied.includes(normalized)) return true;
  }
  return false;
}

// --- Main Component ---
export function AdminUserAccessControl() {
  const { selectedCampanhaId, campanhaId } = useAuth();
  const effectiveCampanhaId = selectedCampanhaId || campanhaId;
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Fetch users with parent_id
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['campaign-users-for-access', effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data: profileUsers } = await supabase
        .from('profiles')
        .select('id, name, email, parent_id')
        .eq('campanha_id', effectiveCampanhaId);

      const { data: campanhaLinks } = await supabase
        .from('user_campanhas')
        .select('user_id')
        .eq('campanha_id', effectiveCampanhaId);

      const linkedIds = new Set(campanhaLinks?.map(l => l.user_id) || []);
      const profileMap = new Map<string, ProfileOption>();

      (profileUsers || []).forEach(p => profileMap.set(p.id, p));

      if (linkedIds.size > 0) {
        const missingIds = Array.from(linkedIds).filter(id => !profileMap.has(id));
        if (missingIds.length > 0) {
          const { data: extra } = await supabase
            .from('profiles')
            .select('id, name, email, parent_id')
            .in('id', missingIds);
          (extra || []).forEach(p => profileMap.set(p.id, p));
        }
      }

      return Array.from(profileMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!effectiveCampanhaId,
  });

  const selectedUser = useMemo(() => users?.find(u => u.id === selectedUserId), [users, selectedUserId]);
  const parentId = selectedUser?.parent_id || null;

  // Fetch selected user's access rules
  const { data: userRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['user-access-control-admin', effectiveCampanhaId, selectedUserId],
    queryFn: async () => {
      if (!effectiveCampanhaId || !selectedUserId) return [];
      const { data, error } = await supabase
        .from('user_access_control')
        .select('id, user_id, route, allowed')
        .eq('campanha_id', effectiveCampanhaId)
        .eq('user_id', selectedUserId);
      if (error) throw error;
      return (data || []) as UserAccessRow[];
    },
    enabled: !!effectiveCampanhaId && !!selectedUserId,
  });

  // Fetch parent's user-level overrides
  const { data: parentUserRules } = useQuery({
    queryKey: ['user-access-control-admin', effectiveCampanhaId, parentId],
    queryFn: async () => {
      if (!effectiveCampanhaId || !parentId) return [];
      const { data, error } = await supabase
        .from('user_access_control')
        .select('id, user_id, route, allowed')
        .eq('campanha_id', effectiveCampanhaId)
        .eq('user_id', parentId);
      if (error) throw error;
      return (data || []) as UserAccessRow[];
    },
    enabled: !!effectiveCampanhaId && !!parentId,
  });

  // Fetch parent's roles
  const { data: parentRolesData } = useQuery({
    queryKey: ['parent-roles', parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', parentId);
      return (data || []).map(r => r.role);
    },
    enabled: !!parentId,
  });

  // Fetch role-based access_control rules for the campaign
  const { data: roleRules } = useQuery({
    queryKey: ['access-control-rules', effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data, error } = await supabase
        .from('access_control')
        .select('role, route, allowed')
        .eq('campanha_id', effectiveCampanhaId);
      if (error) throw error;
      return (data || []) as AccessControlRow[];
    },
    enabled: !!effectiveCampanhaId,
  });

  // Check if parent has access to a given route
  const parentHasAccess = (route: string): boolean | null => {
    if (!parentId || !parentRolesData) return null; // no parent or data not loaded
    const parentIsMaster = parentRolesData.includes('master');
    return resolveEffectiveAccess(
      route,
      parentUserRules || [],
      roleRules || [],
      parentRolesData,
      parentIsMaster,
    );
  };

  const parentName = useMemo(() => {
    if (!parentId || !users) return null;
    return users.find(u => u.id === parentId)?.name || 'Líder';
  }, [parentId, users]);

  const upsertMutation = useMutation({
    mutationFn: async ({ route, allowed }: { route: string; allowed: boolean }) => {
      if (!effectiveCampanhaId || !selectedUserId) throw new Error('Dados insuficientes');
      const { error } = await supabase
        .from('user_access_control')
        .upsert(
          { campanha_id: effectiveCampanhaId, user_id: selectedUserId, route, allowed },
          { onConflict: 'campanha_id,user_id,route' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access-control-admin', effectiveCampanhaId, selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-access-control'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ route }: { route: string }) => {
      if (!effectiveCampanhaId || !selectedUserId) throw new Error('Dados insuficientes');
      const { error } = await supabase
        .from('user_access_control')
        .delete()
        .eq('campanha_id', effectiveCampanhaId)
        .eq('user_id', selectedUserId)
        .eq('route', route);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-access-control-admin', effectiveCampanhaId, selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-access-control'] });
    },
  });

  const getUserRule = (route: string): boolean | undefined => {
    if (!userRules) return undefined;
    const rule = userRules.find(r => r.route === route);
    return rule ? rule.allowed : undefined;
  };

  const cycleAccess = (route: string) => {
    const current = getUserRule(route);
    if (current === undefined) {
      upsertMutation.mutate({ route, allowed: false });
    } else if (current === false) {
      upsertMutation.mutate({ route, allowed: true });
    } else {
      deleteMutation.mutate({ route });
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (!effectiveCampanhaId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecione uma campanha para configurar o controle por usuário.
        </CardContent>
      </Card>
    );
  }

  const renderStatusBadge = (status: boolean | undefined) => {
    if (status === undefined) return <Badge variant="outline" className="text-[10px]">Herda</Badge>;
    if (status === true) return <Badge className="bg-green-600 text-[10px]">Permitido</Badge>;
    return <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>;
  };

  const renderHierarchyWarning = (route: string) => {
    const status = getUserRule(route);
    if (status !== true) return null; // only warn when explicitly allowing

    const parentAccess = parentHasAccess(route);
    if (parentAccess === null || parentAccess === true) return null; // no parent or parent has access

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertTriangle className="w-4 h-4 text-amber-500 inline-block ml-1" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <p className="text-xs">
              Atenção: o líder <strong>{parentName}</strong> não tem acesso a esta rota. Este usuário terá mais permissão que seu superior.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderRouteRow = (entry: RouteEntry, indent = false) => {
    const status = getUserRule(entry.route);
    return (
      <tr key={entry.route} className={cn(indent && "bg-muted/30")}>
        <td className={cn("py-2 px-3 text-sm font-medium border-b border-border", indent && "pl-8")}>
          {entry.label}
          <span className="ml-2 text-xs text-muted-foreground">{entry.route}</span>
        </td>
        <td className="py-2 px-3 text-center border-b border-border">
          <span className="inline-flex items-center gap-1">
            {renderStatusBadge(status)}
            {renderHierarchyWarning(entry.route)}
          </span>
        </td>
        <td className="py-2 px-3 text-center border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => cycleAccess(entry.route)}
            disabled={upsertMutation.isPending || deleteMutation.isPending}
          >
            Alterar
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Controle por Usuário
        </CardTitle>
        <CardDescription>
          Override individual sobre a regra por função. "Herda" = segue a regra do cargo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedUserId || ""}
          onValueChange={(v) => setSelectedUserId(v || null)}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Selecione um usuário..." />
          </SelectTrigger>
          <SelectContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              (users || []).map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedUserId && parentName && (
          <p className="text-xs text-muted-foreground">
            Líder: <strong>{parentName}</strong>
          </p>
        )}

        {selectedUserId && rulesLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {selectedUserId && !rulesLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left font-semibold border-b-2 border-border min-w-[200px]">Módulo / Página</th>
                  <th className="py-2 px-3 text-center border-b-2 border-border min-w-[100px]">Status</th>
                  <th className="py-2 px-3 text-center border-b-2 border-border min-w-[80px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {ROUTE_REGISTRY.map(mod => {
                  if (!mod.children) return renderRouteRow(mod);
                  const isOpen = openModules.has(mod.id);
                  return [
                    <tr key={mod.id}>
                      <td className="py-2 px-3 border-b border-border">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="flex items-center gap-2 text-sm font-semibold cursor-pointer hover:text-primary w-full"
                        >
                          <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
                          {mod.label}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center border-b border-border">
                        <span className="inline-flex items-center gap-1">
                          {renderStatusBadge(getUserRule(mod.route))}
                          {renderHierarchyWarning(mod.route)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border-b border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => cycleAccess(mod.route)}
                          disabled={upsertMutation.isPending || deleteMutation.isPending}
                        >
                          Alterar
                        </Button>
                      </td>
                    </tr>,
                    ...(isOpen ? mod.children.map(child => renderRouteRow(child, true)) : []),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
