import { Schema } from "effect";
import type { DecisionRequest } from "./request";

export const Probability = Schema.Finite.check(
  Schema.isBetween({ minimum: 0, maximum: 1 }),
);
const NonNegative = Schema.Finite.check(
  Schema.makeFilter((value) => value >= 0),
);
const Distribution = Schema.Record(Schema.String, Probability);
const Confidence = { confidence: Schema.optionalKey(Probability) };

export const Answer = Schema.Union([
  Schema.Struct({ type: Schema.Literal("noul"), noul: Probability }),
  Schema.Struct({
    type: Schema.Literal("choice"),
    choice: Schema.String,
    probabilities: Schema.optionalKey(Distribution),
    ...Confidence,
  }),
  Schema.Struct({
    type: Schema.Literal("score"),
    score: NonNegative,
    probabilities: Schema.optionalKey(Distribution),
    legend: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
    ...Confidence,
  }),
  Schema.Struct({
    type: Schema.Literal("box"),
    box: Schema.Struct({
      top: Probability,
      bottom: Probability,
      left: Probability,
      right: Probability,
    }).check(
      Schema.makeFilter((box) => box.left < box.right && box.top < box.bottom),
    ),
    ...Confidence,
  }),
]);
export type Answer = typeof Answer.Type;

export const DecisionResponse = Schema.Struct({
  model: Schema.NonEmptyString,
  id: Schema.optionalKey(Schema.String),
  provider: Schema.optionalKey(Schema.String),
  answers: Schema.Record(Schema.String, Answer),
  usage: Schema.Struct({
    input_tokens: NonNegative,
    output_tokens: NonNegative,
    cost: Schema.optionalKey(NonNegative),
  }),
});
export type DecisionResponse = typeof DecisionResponse.Type;

export function responseFor(request: DecisionRequest) {
  return DecisionResponse.check(
    Schema.makeFilter((response) => {
      if (
        Object.keys(response.answers).length !==
        Object.keys(request.questions).length
      )
        return false;
      return Object.entries(request.questions).every(([id, question]) => {
        const answer = response.answers[id];
        if (!answer || answer.type !== question.type) return false;
        let keys: string[] = [];
        if (question.type === "choice" && answer.type === "choice") {
          keys = Object.keys(question.criteria);
          if (!keys.includes(answer.choice)) return false;
        }
        if (question.type === "score" && answer.type === "score") {
          keys = question.criteria.map((_, index) => String(index));
          if (answer.score > keys.length - 1) return false;
        }
        if ("probabilities" in answer && answer.probabilities) {
          const probabilities = answer.probabilities;
          return (
            Object.keys(probabilities).length === keys.length &&
            keys.every((key) => Object.hasOwn(probabilities, key)) &&
            Math.abs(
              Object.values(probabilities).reduce(
                (sum, value) => sum + value,
                0,
              ) - 1,
            ) <= 0.010000001
          );
        }
        return true;
      });
    }),
  );
}

export const DecisionRun = Schema.Struct({
  response: DecisionResponse,
  rawResponse: Schema.Unknown,
  durationMs: NonNegative,
});
export type DecisionRun = typeof DecisionRun.Type;
export const ApiError = Schema.Struct({
  error: Schema.Struct({ code: Schema.String, message: Schema.String }),
});
