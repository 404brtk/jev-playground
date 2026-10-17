import { MODEL, type DecisionRequest } from "@/features/decisions/request";

export const DRAW_WORDS = [
  "cat",
  "house",
  "tree",
  "bicycle",
  "sun",
  "fish",
  "flower",
  "umbrella",
  "rocket",
  "cup",
  "car",
  "butterfly",
];

function choice(
  state: unknown,
  instructions: string,
  criteria: Record<string, string | null>,
): DecisionRequest {
  return {
    model: MODEL,
    state,
    questions: { decision: { type: "choice", instructions, criteria } },
  };
}

function imageState(image: string) {
  return [{ type: "image_url", image_url: { url: image } }];
}

export function drawingRequest(image: string): DecisionRequest {
  return choice(
    imageState(image),
    "Which object does this hand-drawn sketch depict? Choose the closest match from the available options.",
    Object.fromEntries(DRAW_WORDS.map((word) => [word, null])),
  );
}

export function parseInteger(value: string) {
  const text = value.trim();
  if (!/^[+-]?\d{1,256}$/.test(text))
    throw new Error(
      "Enter a whole number with up to 256 digits. Minus signs are allowed.",
    );
  return { text, even: BigInt(text) % BigInt(2) === BigInt(0) };
}

export function evenRequest(value: string): DecisionRequest {
  const { text } = parseInteger(value);
  return choice({ number: text }, "Is this integer even or odd?", {
    even: "The integer is divisible by 2 with no remainder.",
    odd: "The integer is not divisible by 2 with no remainder.",
  });
}

export function pizzaRequest(image: string): DecisionRequest {
  return choice(imageState(image), "Does this photograph show pizza?", {
    pizza: "Pizza: a baked dough base with savory pizza toppings.",
    not_pizza:
      "Any food or object other than pizza, including pancakes and sweet fruit tarts.",
  });
}
