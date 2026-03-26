export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
}

export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) {
    return [];
  }
  const response = await fetch(
    `http://localhost:8000/api/geocode/suggest?q=${encodeURIComponent(q)}`
  );
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { suggestions?: AddressSuggestion[] };
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}
