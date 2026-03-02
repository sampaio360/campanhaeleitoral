import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

export function NavActiveCampaign() {
  const { isMaster, selectedCampanhaId, campanhaId } = useAuth();
  const [campaignName, setCampaignName] = useState<string | null>(null);

  const activeCampanhaId = isMaster ? selectedCampanhaId : campanhaId;

  useEffect(() => {
    if (!activeCampanhaId) {
      setCampaignName(isMaster ? null : null);
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
  }, [activeCampanhaId, isMaster]);

  if (!activeCampanhaId && isMaster) {
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
