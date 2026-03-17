import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { AuditTimeline } from "@/components/dashboard/AuditTimeline";

import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface AuditEntry {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  new_data: Json | null;
  record_id: string | null;
  user_id: string | null;
}

const Audit = () => {
  const { userRoles, profile, isAdmin } = useAuth();
  const isMaster = userRoles.includes("master");
  const isCoordinator = userRoles.includes("coordinator");
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCampanhaId = useActiveCampanhaId();

  const fetchAudit = useCallback(async () => {
    if (!activeCampanhaId && !isMaster) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Get tables that belong to this campaign by querying each relevant table
      // and collecting record_ids, then filtering audit_log
      // Simpler approach: fetch audit entries and filter by campaign-related records
      
      // First get team IDs if coordinator
      let teamIds: string[] | undefined;
      if (isCoordinator && !isAdmin && profile?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("parent_id", profile.id);
        teamIds = [profile.id, ...(data?.map(p => p.id) || [])];
      }

      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter by team if coordinator
      if (isCoordinator && !isAdmin && teamIds) {
        query = query.in("user_id", teamIds);
      }

      const { data } = await query;

      // Now filter client-side: keep only entries whose record belongs to this campaign
      // We need to check new_data for campanha_id match
      const filtered = (data as AuditEntry[] || []).filter((entry) => {
        // Master with no filter sees all
        if (isMaster && !activeCampanhaId) return true;
        
        // Check if new_data contains campanha_id matching
        if (entry.new_data && typeof entry.new_data === "object" && !Array.isArray(entry.new_data)) {
          const obj = entry.new_data as Record<string, Json | undefined>;
          if (obj.campanha_id === activeCampanhaId) return true;
        }
        
        // For tables that don't have campanha_id in the data (like profiles, user_roles)
        // we still show them if the user belongs to this campaign
        const globalTables = ["profiles", "user_roles", "candidates"];
        if (globalTables.includes(entry.table_name)) return true;
        
        return false;
      });

      setAuditData(filtered);
    } finally {
      setLoading(false);
    }
  }, [activeCampanhaId, isMaster, isCoordinator, isAdmin, profile]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4">
        <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4">
          <div className="pt-6 sm:pt-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Histórico de Atividades</h1>
            <p className="text-sm text-muted-foreground">
              Registro de todas as ações realizadas na campanha
            </p>
          </div>
        </div>

        <AuditTimeline data={auditData} loading={loading} />
      </div>
    </div>
  );
};

export default Audit;
