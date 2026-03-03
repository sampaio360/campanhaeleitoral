/**
 * Geocode an address using Google Maps Geocoding API (client-side).
 * Returns lat/lng or null if not found.
 */
export async function geocodeAddress(
  parts: { endereco?: string; bairro?: string; cidade?: string; estado?: string; cep?: string }
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const addressParts = [parts.endereco, parts.bairro, parts.cidade, parts.estado, parts.cep].filter(Boolean);
  if (addressParts.length === 0) return null;

  const address = addressParts.join(", ") + ", Brasil";

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=br`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}
