import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";

/**
 * Converts a hex color (#RRGGBB) to HSL string "H S% L%" for CSS variables.
 */
function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Applies the active campaign's cor_primaria as CSS custom properties on :root.
 * Falls back to the default Google Blue if no color is set.
 */
export function useCampaignTheme() {
  const campanhaId = useActiveCampanhaId();

  const { data: corPrimaria } = useQuery({
    queryKey: ["campanha-cor", campanhaId],
    queryFn: async () => {
      if (!campanhaId) return null;
      const { data } = await supabase
        .from("campanhas")
        .select("cor_primaria")
        .eq("id", campanhaId)
        .maybeSingle();
      return data?.cor_primaria || null;
    },
    enabled: !!campanhaId,
    staleTime: 60_000, // 1min cache
  });

  useEffect(() => {
    const root = document.documentElement;

    if (!corPrimaria) {
      // Reset to default Google Blue
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-hover");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-accent-foreground");
      root.style.removeProperty("--sidebar-ring");
      root.style.removeProperty("--chart-1");
      return;
    }

    const hsl = hexToHSL(corPrimaria);
    if (!hsl) return;

    // Parse H, S, L to compute hover (darker) variant
    const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!parts) return;
    const [, h, s, l] = parts.map(Number);
    const hoverL = Math.max(l - 8, 10);
    const hoverHSL = `${h} ${Math.max(s - 5, 0)}% ${hoverL}%`;

    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--primary-hover", hoverHSL);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--accent-foreground", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-accent-foreground", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
    root.style.setProperty("--chart-1", hsl);
  }, [corPrimaria]);
}
