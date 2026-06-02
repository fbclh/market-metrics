export const API_RATE_LIMIT_MESSAGE =
  'Market data is temporarily unavailable — the API rate limit has been reached.';

type ErrorPayload = {
  message?: string;
  error?: string;
  status?: string;
};

export function isRateLimitStatus(status: number): boolean {
  return status === 429;
}

export function isRateLimitMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('maximum requests') ||
    lower.includes('exceeded')
  );
}

export function isRateLimitPayload(
  payload: ErrorPayload | null | undefined,
): boolean {
  if (!payload) {
    return false;
  }

  if (payload.message === API_RATE_LIMIT_MESSAGE) {
    return true;
  }

  const text = `${payload.message ?? ''} ${payload.error ?? ''}`;
  return isRateLimitMessage(text);
}

export function getApiErrorMessage(
  status: number,
  payload: ErrorPayload | null | undefined,
  fallback: string,
): string {
  if (
    isRateLimitStatus(status) ||
    isRateLimitPayload(payload) ||
    (payload?.message === API_RATE_LIMIT_MESSAGE)
  ) {
    return API_RATE_LIMIT_MESSAGE;
  }

  return payload?.message ?? payload?.error ?? fallback;
}

export function rateLimitJsonResponse() {
  return {
    status: 'ERROR' as const,
    message: API_RATE_LIMIT_MESSAGE,
  };
}

export function resolveStockLoadError(err: unknown): string {
  if (err instanceof Error) {
    if (
      err.message === API_RATE_LIMIT_MESSAGE ||
      isRateLimitMessage(err.message)
    ) {
      return API_RATE_LIMIT_MESSAGE;
    }

    return err.message;
  }

  return API_RATE_LIMIT_MESSAGE;
}
