import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Maximize2, Minimize2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { geocodeAddress } from "@/lib/geocode";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SupporterPoint {
  latitude: number | null;
  longitude: number | null;
  nome: string;
  bairro: string | null;
  cidade: string | null;
}

interface LeafletHeatmapProps {
  data: SupporterPoint[];
  loading: boolean;
  campanhaId?: string | null;
  onGeocoded?: () => void;
}

function PointsCanvas({ points, height }: { points: SupporterPoint[]; height: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const validPoints = points.filter(
    (d) => d.latitude != null && d.longitude != null
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const init = () => {
      if (cancelled || !el) return;
      if (el.clientHeight === 0 || el.clientWidth === 0) {
        timer = setTimeout(init, 50);
        return;
      }

      const center: L.LatLngExpression =
        validPoints.length > 0
          ? [validPoints[0].latitude!, validPoints[0].longitude!]
          : [-14.235, -51.9253];

      const map = L.map(el).setView(center, validPoints.length > 0 ? 12 : 4);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      if (validPoints.length > 0) {
        // Group nearby points for count display
        const locationMap = new Map<string, { count: number; lat: number; lng: number; label: string; names: string[] }>();
        validPoints.forEach((p) => {
          const key = `${p.latitude!.toFixed(4)},${p.longitude!.toFixed(4)}`;
          const existing = locationMap.get(key);
          if (existing) {
            existing.count++;
            if (existing.names.length < 5) existing.names.push(p.nome);
          } else {
            locationMap.set(key, {
              count: 1,
              lat: p.latitude!,
              lng: p.longitude!,
              label: [p.bairro, p.cidade].filter(Boolean).join(", ") || p.nome,
              names: [p.nome],
            });
          }
        });

        const maxCount = Math.max(...Array.from(locationMap.values()).map((l) => l.count), 1);

        locationMap.forEach((loc) => {
          const intensity = loc.count / maxCount;
          const radius = Math.max(6, Math.min(18, 6 + intensity * 12));
          const color =
            intensity > 0.7 ? "hsl(0, 72%, 51%)" :
            intensity > 0.4 ? "hsl(25, 95%, 53%)" :
            intensity > 0.2 ? "hsl(48, 96%, 53%)" :
            "hsl(217, 91%, 60%)";

          const namesHtml = loc.names.map((n) => `• ${n}`).join("<br/>");
          const extra = loc.count > 5 ? `<br/><em>+${loc.count - 5} mais</em>` : "";

          L.circleMarker([loc.lat, loc.lng], {
            radius,
            fillColor: color,
            color: "hsl(0, 0%, 100%)",
            weight: 2,
            fillOpacity: 0.85,
          })
            .bindPopup(
              `<strong>${loc.label}</strong><br/>` +
              `<span style="font-size:12px;color:#888">${loc.count} apoiador${loc.count > 1 ? "es" : ""}</span>` +
              `<hr style="margin:4px 0;border-color:#eee"/>` +
              `<span style="font-size:11px">${namesHtml}${extra}</span>`
            )
            .addTo(map);
        });

        if (validPoints.length > 1) {
          const bounds = L.latLngBounds(
            validPoints.map((p) => [p.latitude!, p.longitude!] as L.LatLngExpression)
          );
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [validPoints.length]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden ${height}`}
    />
  );
}

export function LeafletHeatmap({ data, loading, campanhaId, onGeocoded }: LeafletHeatmapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const { toast } = useToast();

  const cities = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => { if (d.cidade) set.add(d.cidade); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedCity === "all") return data;
    return data.filter((d) => d.cidade === selectedCity);
  }, [data, selectedCity]);

  const validPoints = filteredData.filter(
    (d) => d.latitude != null && d.longitude != null
  );
  const missingCount = filteredData.length - validPoints.length;

  const handleBatchGeocode = async () => {
    if (!campanhaId) return;
    setGeocoding(true);
    try {
      const { data: supporters } = await supabase
        .from("supporters")
        .select("id, endereco, bairro, cidade, estado, cep")
        .eq("campanha_id", campanhaId)
        .is("latitude", null);

      if (!supporters || supporters.length === 0) {
        toast({ title: "Todos os apoiadores já possuem coordenadas." });
        return;
      }

      let updated = 0;
      for (const s of supporters) {
        const result = await geocodeAddress({
          endereco: s.endereco ?? undefined,
          bairro: s.bairro ?? undefined,
          cidade: s.cidade ?? undefined,
          estado: s.estado ?? undefined,
          cep: s.cep ?? undefined,
        });
        if (result) {
          await supabase
            .from("supporters")
            .update({ latitude: result.lat, longitude: result.lng })
            .eq("id", s.id);
          updated++;
        }
      }

      toast({
        title: `${updated} de ${supporters.length} apoiadores geocodificados.`,
        description: updated < supporters.length
          ? `${supporters.length - updated} não puderam ser localizados (endereço insuficiente).`
          : undefined,
      });
      onGeocoded?.();
    } catch (err) {
      console.error("Batch geocode error:", err);
      toast({ title: "Erro ao geocodificar", variant: "destructive" });
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5" /> Mapa de Apoiadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {fullscreen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />}
      <Card className={
        fullscreen
          ? "fixed inset-0 z-50 rounded-none flex flex-col m-0 border-0"
          : ""
      }>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0 flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5" /> Mapa de Apoiadores
            {filteredData.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {validPoints.length}/{filteredData.length} no mapa
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1 flex-wrap">
            {cities.length > 1 && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {missingCount > 0 && campanhaId && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={handleBatchGeocode}
                disabled={geocoding}
              >
                <RefreshCw className={`w-3 h-3 ${geocoding ? "animate-spin" : ""}`} />
                {geocoding ? "Localizando…" : `Localizar ${missingCount}`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFullscreen((f) => !f)}
              title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={fullscreen ? "flex-1 p-0 min-h-0 relative" : ""}>
          {missingCount > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>
                {missingCount} apoiador{missingCount > 1 ? "es" : ""} sem coordenadas
                {validPoints.length === 0 ? " — clique em \"Localizar\" para geocodificar." : "."}
              </span>
            </div>
          )}
          {validPoints.length === 0 && missingCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum apoiador com geolocalização cadastrado.</p>
              <p className="text-xs mt-1">Cadastre apoiadores com endereço para preencher o mapa automaticamente.</p>
            </div>
          ) : validPoints.length > 0 ? (
            <div className={fullscreen ? "absolute inset-0" : ""}>
              <PointsCanvas
                key={`${fullscreen ? "fs" : "normal"}-${selectedCity}`}
                points={filteredData}
                height={fullscreen ? "h-full" : "h-80"}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
