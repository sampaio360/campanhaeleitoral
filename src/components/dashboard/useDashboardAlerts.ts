import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RecurrenceAlert {
  street_id: string;
  street_name: string;
  bairro: string | null;
  cidade: string | null;
  days_since: number;
}

interface EffectivenessEntry {
  cidade: string;
  streets_visited: number;
  total_cost: number;
  cost_per_street: number;
}

export function useRecurrenceAlerts(overrideCampanhaId?: string | null, thresholdDays = 7) {
  const { campanhaId: profileCampanhaId, userRoles } = useAuth();
  const isMaster = userRoles.includes("master");
  const campanhaId = overrideCampanhaId || profileCampanhaId;
  const [alerts, setAlerts] = useState<RecurrenceAlert[]>([]);

  const fetch = useCallback(async () => {
    if (!campanhaId && !isMaster) return;
    if (!campanhaId) return; // master needs to select a campaign for alerts

    // Get streets with their latest completed checkin
    const { data: streets } = await supabase
      .from("streets")
      .select("id, nome, bairro, cidade")
      .eq("campanha_id", campanhaId);

    if (!streets || streets.length === 0) return;

    const { data: checkins } = await supabase
      .from("street_checkins")
      .select("street_id, ended_at")
      .eq("campanha_id", campanhaId)
      .eq("status", "completed")
      .order("ended_at", { ascending: false });

    // Build map: street_id -> latest ended_at
    const latestMap = new Map<string, string>();
    (checkins || []).forEach((c: any) => {
      if (!latestMap.has(c.street_id) && c.ended_at) {
        latestMap.set(c.street_id, c.ended_at);
      }
    });

    const now = Date.now();
    const result: RecurrenceAlert[] = [];

    streets.forEach((s) => {
      const latest = latestMap.get(s.id);
      if (latest) {
        const daysSince = Math.floor((now - new Date(latest).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= thresholdDays) {
          result.push({
            street_id: s.id,
            street_name: s.nome,
            bairro: s.bairro,
            cidade: s.cidade,
            days_since: daysSince,
          });
        }
      }
    });

    result.sort((a, b) => b.days_since - a.days_since);
    setAlerts(result);
  }, [campanhaId, thresholdDays]);

  useEffect(() => { fetch(); }, [fetch]);

  return alerts;
}

export function useEffectivenessRanking(overrideCampanhaId?: string | null) {
  const { campanhaId: profileCampanhaId, userRoles } = useAuth();
  const campanhaId = overrideCampanhaId || profileCampanhaId;
  const [ranking, setRanking] = useState<EffectivenessEntry[]>([]);

  const fetch = useCallback(async () => {
    if (!campanhaId) return; // needs campaign context for ranking

    // Get completed checkins grouped by city
    const { data: checkins } = await supabase
      .from("street_checkins")
      .select("street_id, streets(cidade)")
      .eq("campanha_id", campanhaId)
      .eq("status", "completed");

    // Get resource costs by city
    const { data: resources } = await supabase
      .from("resource_requests")
      .select("cidade, valor_estimado")
      .eq("campanha_id", campanhaId);

    // Count unique streets per city
    const cityStreets = new Map<string, Set<string>>();
    ((checkins as any[]) || []).forEach((c) => {
      const cidade = c.streets?.cidade || "Sem cidade";
      if (!cityStreets.has(cidade)) cityStreets.set(cidade, new Set());
      cityStreets.get(cidade)!.add(c.street_id);
    });

    // Sum costs per city
    const cityCosts = new Map<string, number>();
    ((resources as any[]) || []).forEach((r) => {
      const cidade = r.cidade || "Sem cidade";
      cityCosts.set(cidade, (cityCosts.get(cidade) || 0) + Number(r.valor_estimado || 0));
    });

    const result: EffectivenessEntry[] = [];
    cityStreets.forEach((streets, cidade) => {
      const totalCost = cityCosts.get(cidade) || 0;
      result.push({
        cidade,
        streets_visited: streets.size,
        total_cost: totalCost,
        cost_per_street: streets.size > 0 ? totalCost / streets.size : 0,
      });
    });

    result.sort((a, b) => a.cost_per_street - b.cost_per_street);
    setRanking(result);
  }, [campanhaId]);

  useEffect(() => { fetch(); }, [fetch]);

  return ranking;
}
