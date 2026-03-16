import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationToggle() {
  const { supported, permission, isSubscribed, loading, subscribe, unsubscribe, vapidConfigured } = usePushNotifications();
  const { toast } = useToast();

  if (!supported || !vapidConfigured) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ title: "Notificações desativadas" });
    } else {
      const ok = await subscribe();
      if (ok) {
        toast({ title: "Notificações ativadas!", description: "Você receberá alertas push neste dispositivo." });
      } else if (permission === "denied") {
        toast({ title: "Permissão bloqueada", description: "Desbloqueie as notificações nas configurações do navegador.", variant: "destructive" });
      }
    }
  };

  return (
    <Button
      variant={isSubscribed ? "secondary" : "outline"}
      size="sm"
      className="gap-2"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {isSubscribed ? "Push ativo" : "Ativar Push"}
    </Button>
  );
}
