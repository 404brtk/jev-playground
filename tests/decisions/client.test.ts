import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
  type Mock,
} from "bun:test";
import { requestDecision, decisionError } from "@/features/decisions/client";
import { evenRequest } from "@/features/arcade/requests";
import { MODEL } from "@/features/decisions/request";

describe("shared decision client", () => {
  let fetchSpy: Mock<
    (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>
  >;
  const response = {
    model: MODEL,
    answers: { decision: { type: "choice", choice: "even" } },
    usage: { input_tokens: 20, output_tokens: 0 },
  };
  beforeEach(() => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ response, rawResponse: response, durationMs: 12 }),
    );
  });
  afterEach(() => fetchSpy.mockRestore());

  test("forwards the request and cancellation signal without client credentials", async () => {
    const signal = new AbortController().signal;
    const request = evenRequest("42");
    const result = await requestDecision(request, signal);
    expect(result.response.answers.decision).toEqual({
      type: "choice",
      choice: "even",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]).toEqual([
      "/api/decisions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      },
    ]);
  });

  test("rejects choices outside the submitted options", async () => {
    fetchSpy.mockResolvedValue(
      Response.json({
        response: {
          ...response,
          answers: { decision: { type: "choice", choice: "pizza" } },
        },
        rawResponse: {},
        durationMs: 12,
      }),
    );
    await expect(
      requestDecision(evenRequest("42"), new AbortController().signal),
    ).rejects.toThrow("invalid response");
  });

  test("shows the server's actionable error without retrying", async () => {
    fetchSpy.mockResolvedValue(
      Response.json(
        {
          error: {
            code: "upstream_error",
            message: "Check your OpenRouter credits.",
          },
        },
        { status: 502 },
      ),
    );
    await expect(
      requestDecision(evenRequest("42"), new AbortController().signal),
    ).rejects.toThrow("Check your OpenRouter credits.");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("rejects an unrelated success envelope", async () => {
    fetchSpy.mockResolvedValue(Response.json({ message: "ok" }));
    await expect(
      requestDecision(evenRequest("42"), new AbortController().signal),
    ).rejects.toThrow("invalid response");
  });

  test("timeouts and unreadable JSON have recovery instructions", () => {
    expect(decisionError(new DOMException("Timed out", "TimeoutError"))).toBe(
      "The request timed out. Try again.",
    );
    expect(decisionError(new SyntaxError("bad JSON"))).toBe(
      "The server returned unreadable JSON. Try again.",
    );
  });
});
