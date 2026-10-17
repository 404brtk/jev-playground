import "server-only";
import { Effect, Schema } from "effect";
import type { DecisionRequest } from "../request";
import { responseFor } from "../response";
import { DecisionError, upstreamError } from "./errors";

const DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";

export function decide(request: DecisionRequest) {
  return Effect.gen(function* () {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return yield* new DecisionError({
        code: "not_configured",
        status: 503,
        message:
          "Add OPENROUTER_API_KEY to .env.local and restart the app to run a decision.",
      });
    }

    const started = yield* Effect.sync(() => performance.now());
    const text = yield* Effect.tryPromise({
      try: async (signal) => {
        const response = await fetch(DECISIONS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
          cache: "no-store",
          signal,
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw upstreamError(response.status);
        }
        return response.text();
      },
      catch: (error) =>
        error instanceof DecisionError
          ? error
          : new DecisionError({
              code: "network_error",
              status: 502,
              message:
                "Could not reach OpenRouter. Check your connection and try again.",
            }),
    });

    const rawResponse: unknown = yield* Effect.try({
      try: () => JSON.parse(text.replaceAll(apiKey, "[REDACTED]")),
      catch: () =>
        new DecisionError({
          code: "invalid_response",
          status: 502,
          message: "OpenRouter returned an unreadable response.",
        }),
    });
    const response = yield* Schema.decodeUnknownEffect(responseFor(request))(
      rawResponse,
    ).pipe(
      Effect.mapError(
        () =>
          new DecisionError({
            code: "invalid_response",
            status: 502,
            message:
              "OpenRouter returned an unexpected decision response. No result has been substituted.",
          }),
      ),
    );

    return {
      response,
      rawResponse,
      durationMs: Math.round(performance.now() - started),
    };
  }).pipe(
    Effect.timeoutOrElse({
      duration: "25 seconds",
      orElse: () =>
        Effect.fail(
          new DecisionError({
            code: "timeout",
            status: 504,
            message: "Jev did not respond within 25 seconds. Please try again.",
          }),
        ),
    }),
  );
}
