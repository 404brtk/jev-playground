import { Option, Schema } from "effect";
import { parseRequest, type DecisionRequest } from "./request";
import { ApiError, DecisionRun, responseFor } from "./response";

export async function requestDecision(
  input: DecisionRequest,
  signal: AbortSignal,
) {
  const request = parseRequest(input);
  const response = await fetch("/api/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = Schema.decodeUnknownOption(ApiError)(body);
    throw new Error(
      Option.isSome(error)
        ? error.value.error.message
        : `Request failed (HTTP ${response.status}). Try again.`,
    );
  }
  const result = Schema.decodeUnknownOption(DecisionRun)(body);
  if (
    Option.isNone(result) ||
    !Schema.is(responseFor(request))(result.value.response)
  )
    throw new Error("The server returned an invalid response. Try again.");
  return result.value;
}

export function decisionError(error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError")
    return "The request timed out. Try again.";
  if (error instanceof SyntaxError)
    return "The server returned unreadable JSON. Try again.";
  return error instanceof Error
    ? error.message
    : "Could not connect. Check your connection and try again.";
}
