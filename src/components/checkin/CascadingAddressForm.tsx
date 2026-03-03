import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

let googleScriptLoaded = false;
let googleScriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (googleScriptLoaded) { resolve(); return; }
    loadCallbacks.push(resolve);
    if (googleScriptLoading) return;
    googleScriptLoading = true;

    window.initGooglePlaces = () => {
      googleScriptLoaded = true;
      googleScriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

function ensurePacStyles() {
  if (document.getElementById("pac-style")) return;
  const style = document.createElement("style");
  style.id = "pac-style";
  style.textContent = `.pac-container { z-index: 99999 !important; }`;
  document.head.appendChild(style);
}

interface CascadingAddressFormProps {
  visible: boolean;
  creating: boolean;
  onSubmit: (data: { nome: string; bairro: string; cidade: string; latitude?: number; longitude?: number }) => void;
  onCancel: () => void;
}

export function CascadingAddressForm({ visible, creating, onSubmit, onCancel }: CascadingAddressFormProps) {
  const [ready, setReady] = useState(false);
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [cidadeLocation, setCidadeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ruaLocation, setRuaLocation] = useState<{ lat: number; lng: number } | null>(null);

  const cidadeRef = useRef<HTMLInputElement>(null);
  const bairroRef = useRef<HTMLInputElement>(null);
  const ruaRef = useRef<HTMLInputElement>(null);

  const cidadeAutoRef = useRef<any>(null);
  const bairroAutoRef = useRef<any>(null);
  const ruaAutoRef = useRef<any>(null);

  // Load Google script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    loadGoogleScript(apiKey).then(() => setReady(true));
  }, []);

  // City autocomplete
  useEffect(() => {
    if (!ready || !visible || !cidadeRef.current || cidadeAutoRef.current) return;
    ensurePacStyles();

    const ac = new window.google.maps.places.Autocomplete(cidadeRef.current, {
      types: ["(cities)"],
      componentRestrictions: { country: "br" },
      fields: ["address_components", "geometry"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      const cityComp = place.address_components.find((c: any) =>
        c.types.includes("administrative_area_level_2") || c.types.includes("locality")
      );
      const cityName = cityComp?.long_name || "";
      setCidade(cityName);

      if (place.geometry?.location) {
        setCidadeLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }

      // Reset downstream
      setBairro("");
      setRua("");

      // Focus next field
      setTimeout(() => bairroRef.current?.focus(), 100);
    });

    cidadeAutoRef.current = ac;

    return () => {
      if (!visible) cidadeAutoRef.current = null;
    };
  }, [ready, visible]);

  // Bairro is free text (Google doesn't filter neighborhoods well)
  // No autocomplete needed here

  // Rua autocomplete (biased to city location)
  useEffect(() => {
    if (!ready || !visible || !ruaRef.current || !cidadeLocation) return;

    if (ruaAutoRef.current) {
      window.google.maps.event.clearInstanceListeners(ruaAutoRef.current);
      ruaAutoRef.current = null;
    }

    const circle = new window.google.maps.Circle({
      center: cidadeLocation,
      radius: 30000,
    });

    const ac = new window.google.maps.places.Autocomplete(ruaRef.current, {
      types: ["address"],
      componentRestrictions: { country: "br" },
      fields: ["address_components", "geometry"],
    });
    ac.setBounds(circle.getBounds());

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      const get = (type: string) =>
        place.address_components.find((c: any) => c.types.includes(type))?.long_name || "";

      const streetName = `${get("route")}${get("street_number") ? `, ${get("street_number")}` : ""}`.trim();
      setRua(streetName);

      // Save street coordinates
      if (place.geometry?.location) {
        setRuaLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }

      // Also fill bairro if empty
      if (!bairro) {
        const b = get("sublocality_level_1") || get("sublocality") || get("neighborhood");
        if (b) setBairro(b);
      }
    });

    ruaAutoRef.current = ac;
  }, [ready, visible, cidadeLocation, bairro]);

  const handleSubmit = () => {
    if (!rua) return;
    onSubmit({
      nome: rua,
      bairro,
      cidade,
      latitude: ruaLocation?.lat ?? cidadeLocation?.lat,
      longitude: ruaLocation?.lng ?? cidadeLocation?.lng,
    });
  };

  // Reset when hidden
  useEffect(() => {
    if (!visible) {
      setCidade("");
      setBairro("");
      setRua("");
      setCidadeLocation(null);
      setRuaLocation(null);
      cidadeAutoRef.current = null;
      bairroAutoRef.current = null;
      ruaAutoRef.current = null;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cadastrar Nova Rua</CardTitle>
        <CardDescription>Selecione cidade → bairro → rua usando autocomplete do Google</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Input
              ref={cidadeRef}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Digite a cidade..."
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro {!cidadeLocation && <span className="text-xs text-muted-foreground">(escolha a cidade primeiro)</span>}</Label>
            <Input
              ref={bairroRef}
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder={cidadeLocation ? "Digite o bairro..." : "Aguardando cidade..."}
              disabled={!cidadeLocation}
            />
          </div>
          <div className="space-y-2">
            <Label>Rua * {!cidadeLocation && <span className="text-xs text-muted-foreground">(escolha a cidade primeiro)</span>}</Label>
            <Input
              ref={ruaRef}
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              placeholder={cidadeLocation ? "Digite a rua..." : "Aguardando cidade..."}
              disabled={!cidadeLocation}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSubmit} disabled={!rua || !cidade || creating}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cadastrar
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
