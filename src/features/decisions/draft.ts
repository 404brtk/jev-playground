import { MODEL, type DecisionRequest, type Question } from "./request";

export type Draft = {
  state: string;
  stateFormat: "text" | "json";
  image: string | null;
  questionId: string;
  type: Question["type"];
  instructions: string;
  choices: { id: string; value: string; description: string | null }[];
  levels: { id: string; description: string }[];
  trueWhen: string;
  falseWhen: string;
};

export function toRequest(draft: Draft): DecisionRequest {
  const state: unknown =
    draft.stateFormat === "json" ? JSON.parse(draft.state) : draft.state;
  let question: Question;
  if (draft.type === "choice") {
    const keys = draft.choices.map((option) => option.value.trim());
    if (new Set(keys).size !== keys.length)
      throw new Error("Give each option a unique value.");
    if (keys.some((key) => !/^[a-zA-Z0-9_-]{1,64}$/.test(key)))
      throw new Error(
        "Option values need 1-64 letters, numbers, underscores, or hyphens.",
      );
    question = {
      type: "choice",
      instructions: draft.instructions,
      criteria: Object.fromEntries(
        draft.choices.map((option) => [
          option.value.trim(),
          option.description,
        ]),
      ),
    };
  } else if (draft.type === "score") {
    question = {
      type: "score",
      instructions: draft.instructions,
      criteria: draft.levels.map((level) => level.description),
    };
  } else if (draft.type === "noul") {
    question = {
      type: "noul",
      instructions: draft.instructions,
      ...(draft.trueWhen || draft.falseWhen
        ? { criteria: { true: draft.trueWhen, false: draft.falseWhen } }
        : {}),
    };
  } else {
    question = { type: "box", instructions: draft.instructions };
  }
  return {
    model: MODEL,
    state: draft.image
      ? [state, { type: "image_url", image_url: { url: draft.image } }]
      : state,
    questions: { [draft.questionId]: question },
  };
}

export function fromRequest(request: DecisionRequest): Draft {
  const [questionId, question] = Object.entries(request.questions)[0];
  let state = request.state;
  let image: string | null = null;
  if (
    Array.isArray(state) &&
    state.length === 2 &&
    state[1]?.type === "image_url"
  ) {
    image = state[1].image_url.url;
    state = state[0];
  }
  return {
    state: typeof state === "string" ? state : JSON.stringify(state, null, 2),
    stateFormat: typeof state === "string" ? "text" : "json",
    image,
    questionId,
    type: question.type,
    instructions: question.instructions,
    choices:
      question.type === "choice"
        ? Object.entries(question.criteria).map(
            ([value, description], index) => ({
              id: `option-${index}`,
              value,
              description,
            }),
          )
        : [],
    levels:
      question.type === "score"
        ? question.criteria.map((description, index) => ({
            id: `level-${index}`,
            description,
          }))
        : [],
    trueWhen: question.type === "noul" ? (question.criteria?.true ?? "") : "",
    falseWhen: question.type === "noul" ? (question.criteria?.false ?? "") : "",
  };
}
