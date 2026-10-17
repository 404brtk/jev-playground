import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
  type Mock,
} from "bun:test";
import { Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";
import sharp from "sharp";
import { toRequest } from "@/features/decisions/draft";
import { freshDraft } from "@/features/decisions/presets";
import { MAX_BODY_BYTES, MODEL } from "@/features/decisions/request";

mock.module("server-only", () => ({}));
const { POST } = await import("@/app/api/decisions/route");
const { decide } = await import("@/features/decisions/server/decide");

const decision = {
  model: MODEL,
  answers: { decision: { type: "noul", noul: 0.98 } },
  usage: { input_tokens: 180, output_tokens: 0 },
};
const payload = () => toRequest(freshDraft(0));
type RequestOptions = {
  headers?: Record<string, string>;
  body?: string;
  payload?: unknown;
  signal?: AbortSignal;
};

function request(options: RequestOptions = {}) {
  return new Request("http://localhost:3000/api/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ?? JSON.stringify(options.payload ?? payload()),
    signal: options.signal,
  });
}

describe("decisions endpoint", () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  let fetchSpy: Mock<
    (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>
  >;
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-secret-never-send";
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(decision),
    );
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
  });

  test("forwards edited request fields once and preserves returned metadata", async () => {
    const draft = freshDraft(0);
    draft.instructions = "Is this reversible?";
    draft.trueWhen = "The action has an undo operation.";
    const input = toRequest(draft);
    const response = await POST(request({ payload: input }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/alpha/decisions");
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer test-secret-never-send",
    );
    expect(options?.body).toBe(JSON.stringify(input));
    expect(result.rawResponse).toEqual(decision);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.response.usage.cost).toBeUndefined();
  });

  test.each<[string, RequestOptions, number]>([
    ["malformed JSON", { body: "{" }, 400],
    ["oversized body", { body: "a".repeat(MAX_BODY_BYTES + 1) }, 413],
    ["wrong content type", { headers: { "Content-Type": "text/plain" } }, 415],
    ["foreign origin", { headers: { Origin: "https://example.com" } }, 403],
    ["invalid request", { payload: { message: "hello" } }, 400],
  ])("rejects %s before calling OpenRouter", async (_, options, status) => {
    const response = await POST(request(options));
    expect(response.status).toBe(status);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("missing key returns setup instructions without an upstream call", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test.each([401, 402, 429, 500, 529])(
    "sanitizes HTTP %s errors and never retries",
    async (status) => {
      fetchSpy.mockResolvedValue(
        new Response("test-secret-never-send provider details", { status }),
      );
      const response = await POST(request());
      const text = await response.text();
      expect(response.status).toBe(status === 429 ? 429 : 502);
      expect(text).not.toContain("test-secret-never-send");
      expect(text).not.toContain("provider details");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    },
  );

  test.each(["not JSON", JSON.stringify({ ...decision, answers: {} })])(
    "rejects an invalid upstream response",
    async (body) => {
      fetchSpy.mockResolvedValue(new Response(body));
      expect((await POST(request())).status).toBe(502);
    },
  );

  test("network failures do not leak credentials", async () => {
    fetchSpy.mockRejectedValue(new Error("test-secret-never-send"));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("test-secret-never-send");
  });

  test("an echoed credential is redacted from raw output", async () => {
    fetchSpy.mockResolvedValue(
      Response.json({ ...decision, extra: "test-secret-never-send" }),
    );
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("test-secret-never-send");
  });

  test("cancellation aborts the upstream fetch", async () => {
    const controller = new AbortController();
    const started = Promise.withResolvers<void>();
    let signal: AbortSignal | undefined;
    fetchSpy.mockImplementation((_, options) => {
      const upstreamSignal = options?.signal;
      if (!upstreamSignal) throw new Error("Missing upstream abort signal");
      signal = upstreamSignal;
      started.resolve();
      return new Promise((_, reject) =>
        upstreamSignal.addEventListener(
          "abort",
          () => reject(upstreamSignal.reason),
          {
            once: true,
          },
        ),
      );
    });
    const pending = POST(request({ signal: controller.signal }));
    await started.promise;
    controller.abort();
    expect((await pending).status).toBe(408);
    expect(signal?.aborted).toBe(true);
  });

  test("the deadline aborts a stalled request after 25 seconds", async () => {
    let signal: AbortSignal | undefined;
    fetchSpy.mockImplementation((_, options) => {
      const upstreamSignal = options?.signal;
      if (!upstreamSignal) throw new Error("Missing upstream abort signal");
      signal = upstreamSignal;
      return new Promise((_, reject) =>
        upstreamSignal.addEventListener(
          "abort",
          () => reject(upstreamSignal.reason),
          {
            once: true,
          },
        ),
      );
    });
    const program = Effect.gen(function* () {
      const fiber = yield* decide(payload()).pipe(
        Effect.flip,
        Effect.forkChild,
      );
      yield* TestClock.adjust("25 seconds");
      return yield* Fiber.join(fiber);
    });
    const error = await Effect.runPromise(
      program.pipe(Effect.provide(TestClock.layer())),
    );
    expect(error.code).toBe("timeout");
    expect(signal?.aborted).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("valid image bytes reach OpenRouter unchanged", async () => {
    const bytes = await sharp({
      create: { width: 280, height: 280, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const draft = freshDraft(4);
    draft.image = `data:image/png;base64,${bytes.toString("base64")}`;
    const input = toRequest(draft);
    expect((await POST(request({ payload: input }))).status).toBe(200);
    expect(fetchSpy.mock.calls[0][1]?.body).toBe(JSON.stringify(input));
  });

  test.each(["data:image/png;base64,YQ==", "data:image/jpeg;base64,YQ=="])(
    "invalid image bytes fail before any paid call",
    async (image) => {
      const draft = freshDraft(4);
      draft.image = image;
      const response = await POST(request({ payload: toRequest(draft) }));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("invalid_image");
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );
});
