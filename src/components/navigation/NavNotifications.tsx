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

    const { count: total, error } = await supabase
      .from("team_messages")
      .select("*", { count: "exact", head: true })
      .eq("campanha_id", activeCampanhaId)
      .neq("sender_id", user.id);

    if (!error && total) setCount(total);
  }, [user, activeCampanhaId]);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("nav-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCount]);

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/messages")}>
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}
