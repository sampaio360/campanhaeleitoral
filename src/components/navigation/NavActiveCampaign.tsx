import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NavActiveCampaign() {
  const { isMaster, isAdmin, selectedCampanhaId, campanhaId, setSelectedCampanhaId } = useAuth();
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [adminCampanhas, setAdminCampanhas] = useState<{ id: string; nome: string; partido: string | null }[]>([]);

  const canSelectCampaign = isMaster || (isAdmin && !campanhaId);
  const activeCampanhaId = canSelectCampaign ? selectedCampanhaId : campanhaId;

  // Fetch available campaigns for admin users
  useEffect(() => {
    if (!isAdmin || isMaster || campanhaId) return;
    const fetchAdminCampanhas = async () => {
      const { data } = await supabase
        .from("campanhas")
        .select("id, nome, partido, municipio, uf")
        .is("deleted_at", null)
        .order("nome");
      if (data) setAdminCampanhas(data);
    };
    fetchAdminCampanhas();
  }, [isAdmin, isMaster, campanhaId]);

  useEffect(() => {
    if (!activeCampanhaId) {
      setCampaignName(null);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("campanhas")
        .select("nome, partido, municipio, uf")
        .eq("id", activeCampanhaId)
        .single();
      if (data) {
        const parts = [data.nome];
        if (data.partido) parts[0] += ` (${data.partido})`;
        if (data.municipio) parts.push(`${data.municipio}/${data.uf}`);
        setCampaignName(parts.join(" - "));
      }
    };
    fetch();
  }, [activeCampanhaId]);

  // Admin users with multi-campaign: show selector
  if (isAdmin && !isMaster && !campanhaId && adminCampanhas.length > 1) {
    return (
      <div className="hidden sm:flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          value={selectedCampanhaId || ""}
          onValueChange={(v) => setSelectedCampanhaId(v)}
        >
          <SelectTrigger className="h-7 text-xs w-[180px]">
            <SelectValue placeholder="Selecione campanha" />
          </SelectTrigger>
          <SelectContent>
            {adminCampanhas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome} {c.partido ? `(${c.partido})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (!activeCampanhaId && (isMaster || isAdmin)) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
        <Building2 className="w-3 h-3" />
        <span>Selecione uma campanha</span>
      </div>
    );
  }

  if (!campaignName) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full max-w-[200px]">
      <Building2 className="w-3 h-3 shrink-0" />
      <span className="truncate">{campaignName}</span>
    </div>
  );
}
