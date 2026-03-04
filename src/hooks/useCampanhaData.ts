import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the active campanha_id for data filtering.
 * Uses selectedCampanhaId (from admin/master selector) first,
 * falls back to the user's profile campanhaId.
 */
export function useActiveCampanhaId(): string | null {
  const { campanhaId, selectedCampanhaId } = useAuth();
  return selectedCampanhaId || campanhaId;
}
