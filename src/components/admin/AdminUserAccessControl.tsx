import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, UserCog, ChevronRight, Minus } from "lucide-react";
import { ROUTE_REGISTRY, RouteEntry } from "@/lib/routeRegistry";
import { cn } from "@/lib/utils";

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
}

export function AdminUserAccessControl() {
  const { selectedCampanhaId, campanhaId } = useAuth();
  const effectiveCampanhaId = selectedCampanhaId || campanhaId;
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Fetch users linked to this campaign
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['campaign-users-for-access', effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      // Get users from profiles + user_campanhas
      const { data: profileUsers } = await supabase
        .from('profiles')
        .select('id, name, email')
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
            .select('id, name, email')
            .in('id', missingIds);
          (extra || []).forEach(p => profileMap.set(p.id, p));
        }
      }

      return Array.from(profileMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!effectiveCampanhaId,
  });

  // Fetch user access rules
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

  const allRoutes = useMemo(() => {
    const set = new Set<string>();
    ROUTE_REGISTRY.forEach(mod => {
      set.add(mod.route);
      mod.children?.forEach(child => set.add(child.route));
    });
    return Array.from(set);
  }, []);

  // Three states: undefined (inherit), true (allowed), false (blocked)
  const getUserRule = (route: string): boolean | undefined => {
    if (!userRules) return undefined;
    const rule = userRules.find(r => r.route === route);
    return rule ? rule.allowed : undefined;
  };

  const cycleAccess = (route: string) => {
    const current = getUserRule(route);
    if (current === undefined) {
      // No rule -> set to blocked
      upsertMutation.mutate({ route, allowed: false });
    } else if (current === false) {
      // Blocked -> set to allowed
      upsertMutation.mutate({ route, allowed: true });
    } else {
      // Allowed -> remove (inherit)
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

  const renderRouteRow = (entry: RouteEntry, indent = false) => {
    const status = getUserRule(entry.route);
    return (
      <tr key={entry.route} className={cn(indent && "bg-muted/30")}>
        <td className={cn("py-2 px-3 text-sm font-medium border-b border-border", indent && "pl-8")}>
          {entry.label}
          <span className="ml-2 text-xs text-muted-foreground">{entry.route}</span>
        </td>
        <td className="py-2 px-3 text-center border-b border-border">
          {renderStatusBadge(status)}
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
                        {renderStatusBadge(getUserRule(mod.route))}
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
