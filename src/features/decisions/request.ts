import { Schema } from "effect";

export const MODEL = "typesafe/jev-1.14";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_BODY_BYTES = 8 * 1024 * 1024;

const Text = Schema.String.check(
  Schema.isMaxLength(12_000),
  Schema.makeFilter((value) => value.trim().length > 0),
);
const Key = Schema.String.check(
  Schema.makeFilter((value) => /^[a-zA-Z0-9_-]{1,64}$/.test(value)),
);
const Description = Schema.String.check(Schema.isMaxLength(2_000));
const Criteria = Schema.Record(Key, Schema.NullOr(Description)).check(
  Schema.makeFilter(
    (value) =>
      Object.keys(value).length >= 2 && Object.keys(value).length <= 32,
  ),
);

export const Question = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("noul"),
    instructions: Text,
    criteria: Schema.optionalKey(
      Schema.Struct({ true: Description, false: Description }),
    ),
  }),
  Schema.Struct({
    type: Schema.Literal("choice"),
    instructions: Text,
    criteria: Criteria,
  }),
  Schema.Struct({
    type: Schema.Literal("score"),
    instructions: Text,
    criteria: Schema.Array(Text).check(
      Schema.makeFilter((value) => value.length >= 2 && value.length <= 10),
    ),
  }),
  Schema.Struct({ type: Schema.Literal("box"), instructions: Text }),
]);

export type Question = typeof Question.Type;

export function imageUrls(value: unknown, depth = 0): string[] {
  if (depth > 32) throw new Error("Keep state nesting to 32 levels or fewer.");
  if (!value || typeof value !== "object") return [];
  if ("type" in value && value.type === "image_url") {
    if (
      !("image_url" in value) ||
      !value.image_url ||
      typeof value.image_url !== "object" ||
      !("url" in value.image_url) ||
      typeof value.image_url.url !== "string"
    )
      throw new Error("Use an image_url part with a data URL.");
    return [value.image_url.url];
  }
  return Object.values(value).flatMap((item) => imageUrls(item, depth + 1));
}

function validState(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string")
    return value.trim().length > 0 && value.length <= 12_000;
  if (typeof value !== "object") return false;
  try {
    const images = imageUrls(value);
    return (
      Object.keys(value).length > 0 &&
      images.length <= 1 &&
      images.every((url) =>
        /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(url),
      )
    );
  } catch {
    return false;
  }
}

export const DecisionRequest = Schema.Struct({
  model: Schema.Literal(MODEL),
  state: Schema.Unknown.check(Schema.makeFilter(validState)),
  questions: Schema.Record(Key, Question).check(
    Schema.makeFilter((value) => Object.keys(value).length === 1),
  ),
}).check(
  Schema.makeFilter((request) =>
    Object.values(request.questions).every(
      (question) =>
        question.type !== "box" || imageUrls(request.state).length === 1,
    ),
  ),
);

export type DecisionRequest = typeof DecisionRequest.Type;

export function parseRequest(value: unknown): DecisionRequest {
  try {
    return Schema.decodeUnknownSync(DecisionRequest, {
      onExcessProperty: "error",
    })(value);
  } catch {
    throw new Error(
      "Use Jev 1.14, a non-empty state, and one question. Choice needs 2-32 unique options; score needs 2-10 levels; box needs an image. PNG/JPEG data URLs only.",
    );
  }
}
