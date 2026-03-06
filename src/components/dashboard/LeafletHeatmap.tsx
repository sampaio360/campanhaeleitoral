import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

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
}

export function LeafletHeatmap({ data, loading }: LeafletHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Invalidate map size when toggling fullscreen
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Multiple invalidations to ensure tiles load correctly
      const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [fullscreen]);

  const validPoints = data.filter(
    (d) => d.latitude != null && d.longitude != null
  );

  useEffect(() => {
    if (!mapRef.current || loading) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: Brazil
    const center: L.LatLngExpression =
      validPoints.length > 0
        ? [validPoints[0].latitude!, validPoints[0].longitude!]
        : [-14.235, -51.9253];

    // Ensure container has dimensions before creating map
    if (mapRef.current.clientHeight === 0 || mapRef.current.clientWidth === 0) return;

    const map = L.map(mapRef.current).setView(center, validPoints.length > 0 ? 12 : 4);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    if (validPoints.length > 0) {
      // Group by location for intensity
      const locationMap = new Map<string, { count: number; lat: number; lng: number; label: string }>();
      validPoints.forEach((p) => {
        const key = `${p.latitude!.toFixed(4)},${p.longitude!.toFixed(4)}`;
        const existing = locationMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          locationMap.set(key, {
            count: 1,
            lat: p.latitude!,
            lng: p.longitude!,
            label: [p.bairro, p.cidade].filter(Boolean).join(", ") || p.nome,
          });
        }
      });

      // Real thermal heatmap layer
      const heatPoints: [number, number, number][] = [];
      locationMap.forEach((loc) => {
        heatPoints.push([loc.lat, loc.lng, loc.count]);
      });

      const maxIntensity = Math.max(...heatPoints.map((p) => p[2]), 1);

      L.heatLayer(heatPoints, {
        radius: 30,
        blur: 20,
        maxZoom: 16,
        max: maxIntensity,
        gradient: {
          0.2: "#2196F3",  // blue
          0.4: "#4CAF50",  // green
          0.6: "#FFEB3B",  // yellow
          0.8: "#FF9800",  // orange
          1.0: "#F44336",  // red
        },
      }).addTo(map);

      // Also add small circle markers with popups for interactivity
      locationMap.forEach((loc) => {
        L.circleMarker([loc.lat, loc.lng], {
          radius: 4,
          fillColor: "transparent",
          color: "transparent",
          weight: 0,
          fillOpacity: 0,
        })
          .bindPopup(`<strong>${loc.label}</strong><br/>${loc.count} apoiador${loc.count > 1 ? "es" : ""}`)
          .addTo(map);
      });

      // Fit bounds
      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(
          validPoints.map((p) => [p.latitude!, p.longitude!] as L.LatLngExpression)
        );
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, loading, fullscreen]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5" /> Mapa de Calor
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5" /> Mapa de Calor — Apoiadores
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent className={fullscreen ? "flex-1 p-0 min-h-0 relative" : ""}>
          {validPoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum apoiador com geolocalização cadastrado.</p>
              <p className="text-xs mt-1">Cadastre apoiadores com endereço para preencher o mapa automaticamente.</p>
            </div>
          ) : (
            <div
              ref={mapRef}
              className={fullscreen ? "absolute inset-0" : "h-80 rounded-lg overflow-hidden"}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
