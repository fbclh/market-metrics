export const FMP_STABLE_BASE_URL = 'https://financialmodelingprep.com/stable';

export function fmpLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`;
}

export function fmpErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (
    typeof data === 'object' &&
    data &&
    'Error Message' in data &&
    typeof (data as { 'Error Message': unknown })['Error Message'] === 'string'
  ) {
    return (data as { 'Error Message': string })['Error Message'];
  }

  if (
    typeof data === 'object' &&
    data &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

export async function fetchFmpJson<T>(
  path: string,
  apiKey: string,
  params: Record<string, string> = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const url = new URL(`${FMP_STABLE_BASE_URL}/${path}`);
  url.searchParams.set('apikey', apiKey);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  const text = await response.text();

  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: fmpErrorMessage(data, `FMP request failed (${response.status}).`),
    };
  }

  if (
    typeof data === 'object' &&
    data &&
    !Array.isArray(data) &&
    ('Error Message' in data || 'message' in data)
  ) {
    return {
      ok: false,
      status: 502,
      message: fmpErrorMessage(data, 'FMP request failed.'),
    };
  }

  return { ok: true, data: data as T };
}
