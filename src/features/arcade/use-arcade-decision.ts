"use client";

import { useEffect, useRef, useState } from "react";
import { requestDecision, decisionError } from "@/features/decisions/client";
import type { DecisionRequest } from "@/features/decisions/request";
import type { Answer, DecisionRun } from "@/features/decisions/response";

export type ChoiceResult = {
  run: DecisionRun;
  answer: Extract<Answer, { type: "choice" }>;
};

export function useArcadeDecision() {
  const [result, setResult] = useState<ChoiceResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  function reset() {
    controller.current?.abort();
    controller.current = null;
    setPending(false);
    setResult(null);
    setError("");
  }

  async function run(
    makeRequest: (
      signal: AbortSignal,
    ) => DecisionRequest | Promise<DecisionRequest>,
  ) {
    if (controller.current) return null;
    const active = new AbortController();
    controller.current = active;
    const signal = AbortSignal.any([
      active.signal,
      AbortSignal.timeout(30_000),
    ]);
    setPending(true);
    setResult(null);
    setError("");
    try {
      const request = await makeRequest(signal);
      signal.throwIfAborted();
      const response = await requestDecision(request, signal);
      const answer = response.response.answers.decision;
      if (answer.type !== "choice")
        throw new Error("Expected a choice from Jev. Try again.");
      if (active.signal.aborted) return null;
      const next = { run: response, answer };
      setResult(next);
      return next;
    } catch (cause) {
      if (!active.signal.aborted) setError(decisionError(cause));
      return null;
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setPending(false);
      }
    }
  }

  return { result, error, pending, run, reset };
}
