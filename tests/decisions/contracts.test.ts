import { describe, expect, test } from "bun:test";
import { Option, Schema } from "effect";
import { fromRequest, toRequest } from "@/features/decisions/draft";
import { freshDraft } from "@/features/decisions/presets";
import { parseRequest } from "@/features/decisions/request";
import { responseFor } from "@/features/decisions/response";

describe("editable requests", () => {
  test.each([0, 1, 2])(
    "form and JSON round-trip without dropping fields (%s)",
    (index) => {
      const draft = freshDraft(index);
      draft.state = "Edited state";
      draft.instructions = "Edited question";
      const request = toRequest(draft);
      expect(
        toRequest(
          fromRequest(parseRequest(JSON.parse(JSON.stringify(request)))),
        ),
      ).toEqual(request);
    },
  );

  test("edited choice values and criteria reach the request", () => {
    const draft = freshDraft(1);
    draft.choices[0].value = "finance";
    draft.choices[0].description = "Invoices only";
    const request = parseRequest(toRequest(draft));
    expect(request.questions.decision).toMatchObject({
      type: "choice",
      criteria: { finance: "Invoices only" },
    });
    expect(request.questions.decision).not.toHaveProperty("criteria.billing");
  });

  test("duplicate option values cannot silently overwrite an option", () => {
    const draft = freshDraft(1);
    draft.choices[1].value = draft.choices[0].value;
    expect(() => toRequest(draft)).toThrow("unique value");
  });

  test("state objects remain objects after editing through the form", () => {
    const request = {
      ...toRequest(freshDraft(0)),
      state: { customer: "Ada", paid: true, attempts: [1, 2] },
    };
    expect(toRequest(fromRequest(parseRequest(request)))).toEqual(request);
  });

  test("null option guidance round-trips unchanged", () => {
    const draft = freshDraft(1);
    draft.choices[0].description = null;
    const request = toRequest(draft);
    expect(toRequest(fromRequest(parseRequest(request)))).toEqual(request);
  });

  test("image state uses OpenRouter data URL parts", () => {
    const draft = freshDraft(3);
    draft.image = "data:image/png;base64,YQ==";
    const request = toRequest(draft);
    expect(request.state).toEqual([
      draft.state,
      { type: "image_url", image_url: { url: draft.image } },
    ]);
    expect(toRequest(fromRequest(parseRequest(request)))).toEqual(request);
  });

  test.each<[string, Record<string, unknown>]>([
    ["empty state", { state: "  " }],
    [
      "empty instructions",
      {
        questions: { decision: { type: "noul", instructions: "" } },
      },
    ],
    ["missing question", { questions: {} }],
    [
      "extra question",
      {
        questions: {
          decision: { type: "noul", instructions: "Is it safe?" },
          extra: { type: "noul", instructions: "Is it safe?" },
        },
      },
    ],
    ["unknown model", { model: "unknown" }],
    ["unknown parameter", { temperature: 1 }],
    [
      "one choice",
      {
        questions: {
          decision: {
            type: "choice",
            instructions: "Pick",
            criteria: { a: "A" },
          },
        },
      },
    ],
    [
      "one score level",
      {
        questions: {
          decision: {
            type: "score",
            instructions: "Rate",
            criteria: ["Low"],
          },
        },
      },
    ],
    [
      "box without image",
      {
        questions: { decision: { type: "box", instructions: "Find it" } },
      },
    ],
    [
      "remote image URL",
      {
        state: [
          {
            type: "image_url",
            image_url: { url: "https://example.com/image.png" },
          },
        ],
      },
    ],
  ])("rejects %s", (_, patch) => {
    const request = { ...toRequest(freshDraft(0)), ...patch };
    expect(() => parseRequest(request)).toThrow();
  });
});

describe("answers match the submitted question", () => {
  const usage = { input_tokens: 180, output_tokens: 0 };
  function accepted(index: number, answer: unknown) {
    const request = toRequest(freshDraft(index));
    return Option.isSome(
      Schema.decodeUnknownOption(responseFor(request))({
        model: request.model,
        answers: { decision: answer },
        usage,
      }),
    );
  }
  test("fractional scores and absent optional metrics are valid", () => {
    expect(accepted(2, { type: "score", score: 1.6 })).toBe(true);
  });
  test("a choice uses editable option values", () => {
    expect(
      accepted(1, {
        type: "choice",
        choice: "billing",
        probabilities: { billing: 0.8, technical: 0.1, sales: 0.1 },
      }),
    ).toBe(true);
    expect(accepted(1, { type: "choice", choice: "unknown" })).toBe(false);
  });
  test.each([
    [0, { type: "noul", noul: 1.1 }],
    [0, { type: "choice", choice: "billing" }],
    [2, { type: "score", score: 4 }],
    [2, { type: "score", score: NaN }],
    [1, { type: "choice", choice: "billing", probabilities: { billing: 1 } }],
    [
      1,
      {
        type: "choice",
        choice: "billing",
        probabilities: { billing: 1, technical: 1, sales: 1 },
      },
    ],
    [3, { type: "box", box: { top: 0.8, bottom: 0.2, left: 0.1, right: 0.9 } }],
  ])("rejects incompatible or invalid answer %s", (index, answer) =>
    expect(accepted(index, answer)).toBe(false),
  );
});
