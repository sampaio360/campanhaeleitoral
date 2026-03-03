import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Lock, ChevronRight } from "lucide-react";
import { ROUTE_REGISTRY, ALL_ROLES, ROLE_LABELS, RouteEntry } from "@/lib/routeRegistry";
import { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type AppRole = Database['public']['Enums']['app_role'];

interface AccessRow {
  id: string;
  role: AppRole;
  route: string;
  allowed: boolean;
}

export function AdminAccessControl() {
  const { isMaster, selectedCampanhaId, campanhaId } = useAuth();
  const effectiveCampanhaId = selectedCampanhaId || campanhaId;
  const queryClient = useQueryClient();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const visibleRoles = isMaster
    ? ALL_ROLES
    : ALL_ROLES.filter(r => r !== 'master' && r !== 'admin');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['access-control-matrix', effectiveCampanhaId],
    queryFn: async () => {
      if (!effectiveCampanhaId) return [];
      const { data, error } = await supabase
        .from('access_control')
        .select('id, role, route, allowed')
        .eq('campanha_id', effectiveCampanhaId);
      if (error) throw error;
      return (data || []) as AccessRow[];
    },
    enabled: !!effectiveCampanhaId,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ role, route, allowed }: { role: AppRole; route: string; allowed: boolean }) => {
      if (!effectiveCampanhaId) throw new Error('Nenhuma campanha selecionada');
      const { error } = await supabase
        .from('access_control')
        .upsert(
          { campanha_id: effectiveCampanhaId, role, route, allowed },
          { onConflict: 'campanha_id,role,route' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control-matrix', effectiveCampanhaId] });
      queryClient.invalidateQueries({ queryKey: ['access-control'] });
    },
  });

  const isAllowed = (role: AppRole, route: string): boolean => {
    if (!rules) return true;
    const rule = rules.find(r => r.role === role && r.route === route);
    return rule ? rule.allowed : true;
  };

  const toggleAccess = (role: AppRole, route: string) => {
    const current = isAllowed(role, route);
    upsertMutation.mutate({ role, route, allowed: !current });
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
          Selecione uma campanha para configurar o controle de acesso.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const renderRouteRow = (entry: RouteEntry, indent: boolean = false) => (
    <tr key={entry.route} className={cn(indent && "bg-muted/30")}>
      <td className={cn("py-2 px-3 text-sm font-medium border-b border-border", indent && "pl-8")}>
        {entry.label}
        <span className="ml-2 text-xs text-muted-foreground">{entry.route}</span>
      </td>
      {visibleRoles.map(role => (
        <td key={role} className="py-2 px-3 text-center border-b border-border">
          <Checkbox
            checked={isAllowed(role, entry.route)}
            onCheckedChange={() => toggleAccess(role, entry.route)}
            disabled={upsertMutation.isPending}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Controle de Acesso
        </CardTitle>
        <CardDescription>
          Configure quais funções podem acessar cada módulo. Desmarcado = bloqueado.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-semibold border-b-2 border-border min-w-[200px]">
                Módulo / Página
              </th>
              {visibleRoles.map(role => (
                <th key={role} className="py-2 px-3 text-center font-semibold border-b-2 border-border min-w-[90px] text-xs">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROUTE_REGISTRY.map(mod => {
              if (!mod.children) {
                return renderRouteRow(mod);
              }
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
                  {visibleRoles.map(role => (
                    <td key={role} className="py-2 px-3 text-center border-b border-border">
                      <Checkbox
                        checked={isAllowed(role, mod.route)}
                        onCheckedChange={() => toggleAccess(role, mod.route)}
                        disabled={upsertMutation.isPending}
                      />
                    </td>
                  ))}
                </tr>,
                ...(isOpen ? mod.children.map(child => renderRouteRow(child, true)) : []),
              ];
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
