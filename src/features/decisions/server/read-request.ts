import { Effect } from "effect";
import { MAX_BODY_BYTES, parseRequest } from "../request";
import { DecisionError } from "./errors";
import { validateImages } from "./validate-images";

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");

  const decoder = new TextDecoder();
  let text = "";
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new DecisionError({
          code: "body_too_large",
          message:
            "Keep the request below 8 MiB. Use a smaller image or less text.",
          status: 413,
        });
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export function readRequest(request: Request) {
  return Effect.gen(function* () {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return yield* new DecisionError({
        code: "forbidden",
        message: "Requests must come from this playground.",
        status: 403,
      });
    }
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    ) {
      return yield* new DecisionError({
        code: "invalid_content_type",
        message: "Send the message as JSON.",
        status: 415,
      });
    }

    const body = yield* Effect.tryPromise({
      try: () => readBody(request),
      catch: (error) =>
        error instanceof DecisionError
          ? error
          : new DecisionError({
              code: "invalid_json",
              message: "The request must contain valid JSON.",
              status: 400,
            }),
    });
    const input = yield* Effect.try({
      try: () => parseRequest(body),
      catch: (error) =>
        new DecisionError({
          code: "invalid_request",
          message:
            error instanceof Error ? error.message : "Check the request JSON.",
          status: 400,
        }),
    });
    yield* validateImages(input.state);
    return input;
  });
}
