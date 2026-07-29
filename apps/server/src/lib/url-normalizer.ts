export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.searchParams.sort();
  return parsed.toString();
}
