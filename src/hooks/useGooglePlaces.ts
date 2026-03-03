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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

// Ensure pac-container has high z-index
function ensurePacStyles() {
  if (document.getElementById("pac-style")) return;
  const style = document.createElement("style");
  style.id = "pac-style";
  style.textContent = `.pac-container { z-index: 99999 !important; }`;
  document.head.appendChild(style);
}

interface UseGooglePlacesOptions {
  /** Optional city name to geocode and use as location bias */
  cityBias?: string;
}

export function useGooglePlaces(
  inputRef: React.RefObject<HTMLInputElement | null>,
  visible: boolean = true,
  options?: UseGooglePlacesOptions
) {
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef<((place: PlaceResult) => void) | null>(null);
  const cityBias = options?.cityBias || "";

  const setOnSelect = useCallback((fn: (place: PlaceResult) => void) => {
    onSelectRef.current = fn;
  }, []);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    loadGoogleScript(apiKey).then(() => setReady(true));
  }, []);

  // Recreate autocomplete when cityBias changes
  useEffect(() => {
    if (!ready || !visible || !inputRef.current) return;

    // Clean up previous instance
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    ensurePacStyles();

    const setupAutocomplete = (bounds?: any) => {
      if (!inputRef.current) return;
      
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "br" },
        fields: ["address_components", "formatted_address"],
      });

      if (bounds) {
        ac.setBounds(bounds);
      }

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
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

      autocompleteRef.current = ac;
    };

    // If we have a city bias, geocode it first to get bounds
    if (cityBias && cityBias.length >= 2) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityBias + ", Brasil")}&key=${apiKey}&region=br`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
            const loc = data.results[0].geometry.location;
            const circle = new window.google.maps.Circle({
              center: { lat: loc.lat, lng: loc.lng },
              radius: 30000,
            });
            setupAutocomplete(circle.getBounds());
          } else {
            setupAutocomplete();
          }
        })
        .catch(() => setupAutocomplete());
    } else {
      setupAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [ready, visible, inputRef, cityBias]);

  return { ready, setOnSelect };
}
