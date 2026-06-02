export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatSearchQueryDisplay(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
}
