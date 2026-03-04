import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DASHBOARD_WIDGETS, useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardWidgets() {
  const { selectedCampanhaId } = useAuth();
  const { isWidgetEnabled, toggleWidget, isLoading } = useDashboardWidgets(selectedCampanhaId);

  if (!selectedCampanhaId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecione uma campanha para configurar os widgets.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutDashboard className="w-5 h-5" />
          Widgets do Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ative ou desative os componentes visuais exibidos no Dashboard.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))
        ) : (
          DASHBOARD_WIDGETS.map((widget) => {
            const enabled = isWidgetEnabled(widget.key);
            return (
              <div
                key={widget.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm cursor-pointer">{widget.label}</Label>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    toggleWidget.mutate({ key: widget.key, enabled: checked })
                  }
                  disabled={toggleWidget.isPending}
                />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
