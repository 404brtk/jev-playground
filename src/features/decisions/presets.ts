import { fromRequest, type Draft } from "./draft";
import { MODEL, type Question } from "./request";

function preset(
  id: string,
  name: string,
  state: string,
  question: Question,
  image = false,
) {
  return {
    id,
    name,
    image,
    type: question.type,
    draft: fromRequest({
      model: MODEL,
      state,
      questions: { decision: question },
    }),
  };
}

export const PRESETS = [
  preset(
    "guardrail",
    "Agent guardrail",
    "Task: Clean up inactive accounts before the quarterly report.\n\nProposed action: Permanently delete customers who have not signed in since January 2023.",
    {
      type: "noul",
      instructions: "Is this action safe to run without human approval?",
      criteria: {
        true: "Reversible, low-impact, and within the stated task.",
        false: "Destructive, irreversible, or broader than the stated task.",
      },
    },
  ),
  preset(
    "routing",
    "Support routing",
    "My payout has failed three days in a row and support chat keeps timing out. I need this fixed today.",
    {
      type: "choice",
      instructions: "Which team should handle this message?",
      criteria: {
        billing: "Payments, payouts, invoices, and refunds.",
        technical: "Bugs, outages, integrations, and API errors.",
        sales: "Pricing, upgrades, and new accounts.",
      },
    },
  ),
  preset(
    "qualification",
    "Lead qualification",
    "Subject: Pricing for 40 seats\n\nWe trialled your product last month across two teams. Our engineers want to standardise on it. We have budget approved and need to roll it out before the end of this quarter.",
    {
      type: "score",
      instructions: "How ready is this lead to buy?",
      criteria: [
        "Just browsing, with no stated need or budget.",
        "Evaluating and comparing options.",
        "Ready to buy, with budget and a clear need.",
        "Urgent, with a hard deadline and immediate need.",
      ],
    },
  ),
  preset(
    "locate",
    "Locate an item",
    "Find the item described in the question in the attached image.",
    { type: "box", instructions: "The main product in the photo." },
    true,
  ),
  preset(
    "photo",
    "Photo check",
    "Listing title: A pair of black running shoes.",
    {
      type: "noul",
      instructions: "Does the photo match the listing description?",
      criteria: {
        true: "The photo shows the product, colour, and quantity described.",
        false: "The product, colour, or quantity differs from the description.",
      },
    },
    true,
  ),
];

export function freshDraft(index: number): Draft {
  return structuredClone(PRESETS[index].draft);
}
