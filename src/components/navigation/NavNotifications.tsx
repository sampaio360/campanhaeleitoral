import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";

export function NavNotifications() {
  const { user } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user || !activeCampanhaId) { setCount(0); return; }

    const { data, error } = await supabase.rpc("get_unread_message_count", {
      _user_id: user.id,
      _campanha_id: activeCampanhaId,
    });

    if (!error && data != null) setCount(data);
  }, [user, activeCampanhaId]);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("nav-messages-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, () => fetchCount())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reads" }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCount]);

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/mensagens")}>
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center px-1 animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
