import { Data } from "effect";

export class DecisionError extends Data.TaggedError("DecisionError")<{
  readonly code: string;
  readonly message: string;
  readonly status: number;
}> {}

export function upstreamError(status: number) {
  const messages: Record<number, string> = {
    400: "OpenRouter rejected the decision request. Check the scenario configuration.",
    401: "OpenRouter rejected the API key. Check OPENROUTER_API_KEY in .env.local.",
    402: "OpenRouter could not fund this request. Check your credits and key limits.",
    403: "OpenRouter denied this request. Check your key permissions and account limits.",
    404: "The selected Jev model or decision endpoint is unavailable.",
    413: "The message is too large for the provider. Try a shorter message.",
    429: "OpenRouter is rate limiting requests. Wait a moment before trying again.",
  };

  return new DecisionError({
    code: "upstream_error",
    message:
      messages[status] ??
      `OpenRouter could not complete the request (HTTP ${status}). Please try again later.`,
    status: status === 429 ? 429 : 502,
  });
}
