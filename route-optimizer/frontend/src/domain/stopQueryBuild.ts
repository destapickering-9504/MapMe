/**
 * Build the stop string for the optimize API when the user enters a place name
 * plus a specific address (often a full autocomplete label).
 * Avoids "Cheesecake Factory, The Cheesecake Factory, 123 Main St" when the
 * address line already starts with the same POI name.
 */

function normalizePlaceKey(s: string): string {
  return s
    .replace(/^the\s+/i, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** True if a Nominatim-style first segment is the same place as the user's name. */
export function placeLabelDuplicatesName(label: string, name: string): boolean {
  const a = normalizePlaceKey(label);
  const b = normalizePlaceKey(name);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(b + " ")) return true;
  if (b.startsWith(a + " ")) return true;
  return false;
}

export function buildStopSearchQuery(name: string, addressLine: string): string {
  const n = name.trim();
  let a = addressLine.trim();
  if (!n) return a;
  if (!a) return n;

  // Peel repeated POI labels (autocomplete often returns "Name, The Name, street, city…").
  let guard = 0;
  while (guard++ < 8) {
    const commaIdx = a.indexOf(",");
    if (commaIdx < 0) {
      break;
    }
    const left = a.slice(0, commaIdx).trim();
    const rest = a.slice(commaIdx + 1).trim();
    if (rest && placeLabelDuplicatesName(left, n)) {
      a = rest;
      continue;
    }
    break;
  }

  if (placeLabelDuplicatesName(a, n)) {
    return n;
  }

  return `${n}, ${a}`;
}
