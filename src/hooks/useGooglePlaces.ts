import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

interface PlaceResult {
  nome: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export function useGooglePlaces(inputRef: React.RefObject<HTMLInputElement | null>) {
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef<((place: PlaceResult) => void) | null>(null);

  const setOnSelect = useCallback((fn: (place: PlaceResult) => void) => {
    onSelectRef.current = fn;
  }, []);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    loadGoogleScript(apiKey).then(() => {
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "br" },
      fields: ["address_components", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const get = (type: string) =>
        place.address_components.find((c: any) => c.types.includes(type))?.long_name || "";

      const result: PlaceResult = {
        nome: `${get("route")}${get("street_number") ? `, ${get("street_number")}` : ""}`.trim(),
        bairro: get("sublocality_level_1") || get("sublocality") || get("neighborhood"),
        cidade: get("administrative_area_level_2") || get("locality"),
        estado: place.address_components.find((c: any) => c.types.includes("administrative_area_level_1"))?.short_name || "",
        cep: get("postal_code"),
      };

      onSelectRef.current?.(result);
    });

    autocompleteRef.current = autocomplete;
  }, [ready, inputRef]);

  return { ready, setOnSelect };
}
