import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface Campanha {
  id: string;
  nome: string;
  partido: string | null;
  municipio: string | null;
  uf: string | null;
}

interface CampaignSelectorProps {
  value: string | null;
  onChange: (campanhaId: string | null) => void;
}

export function CampaignSelector({ value, onChange }: CampaignSelectorProps) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("campanhas")
        .select("id, nome, partido, municipio, uf")
        .is("deleted_at", null)
        .order("nome");
      if (data) setCampanhas(data);
    };
    fetch();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Building2 className="w-5 h-5 text-muted-foreground" />
      <Select
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Todas as campanhas" />
        </SelectTrigger>
        <SelectContent>
          {campanhas.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nome} {c.partido ? `(${c.partido})` : ""} {c.municipio ? `- ${c.municipio}/${c.uf}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
