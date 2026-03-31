export type StopIconVariant = "sage" | "orange" | "green" | "neutral";

export function stopGlyphForName(name: string): string {
  const n = name.toLowerCase();
  if (/pet|vet|paw|bark|dog|cat/.test(n)) return "🐾";
  if (/whole|trader|grocery|foods|market|safeway|kroger|costco|target|walmart/.test(n)) return "🛒";
  if (/coffee|starbucks|café|cafe/.test(n)) return "☕";
  if (/gym|fitness/.test(n)) return "💪";
  return "📍";
}

/** Square tile colors aligned with Map Me reference (sage home, orange pet, green grocery). */
export function stopIconVariantForName(name: string): StopIconVariant {
  const n = name.toLowerCase();
  if (/pet|vet|paw|bark|dog|cat/.test(n)) return "orange";
  if (/whole|trader|grocery|foods|market|safeway|kroger|costco|target|walmart/.test(n)) return "green";
  return "neutral";
}
