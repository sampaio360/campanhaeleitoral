import { useState, useEffect, useRef, useCallback } from "react";

interface IBGEMunicipio {
  id: number;
  nome: string;
  uf: string;
}

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

let cachedMunicipios: IBGEMunicipio[] | null = null;
let fetchPromise: Promise<IBGEMunicipio[]> | null = null;

async function loadMunicipios(): Promise<IBGEMunicipio[]> {
  if (cachedMunicipios) return cachedMunicipios;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
  )
    .then((res) => res.json())
    .then((data: any[]) => {
      cachedMunicipios = data.map((m) => ({
        id: m.id,
        nome: m.nome,
        uf: m.microrregiao?.mesorregiao?.UF?.sigla || "",
      }));
      return cachedMunicipios;
    });

  return fetchPromise;
}

export async function fetchPopulacao(ibgeId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/-6/variaveis/93?localidades=N6[${ibgeId}]`
    );
    const data = await res.json();
    const series = data?.[0]?.resultados?.[0]?.series?.[0]?.serie;
    if (series) {
      const years = Object.keys(series).sort().reverse();
      const pop = series[years[0]];
      if (pop && pop !== "...") return pop;
    }
  } catch (err) {
    console.warn("IBGE population fetch failed:", err);
  }
  return null;
}

export function useIBGEMunicipios() {
  const [municipios, setMunicipios] = useState<IBGEMunicipio[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<IBGEMunicipio[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadMunicipios()
      .then(setMunicipios)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query || query.length < 2 || municipios.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const norm = normalizar(query);
    const results = municipios
      .filter((m) => normalizar(m.nome).includes(norm))
      .slice(0, 10);
    setSuggestions(results);
    setIsOpen(results.length > 0);
  }, [query, municipios]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
  }, []);

  return { query, setQuery, suggestions, isOpen, close, loading };
}
