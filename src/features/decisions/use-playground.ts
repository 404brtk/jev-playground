"use client";

import { Option, Schema } from "effect";
import { useEffect, useRef, useState } from "react";
import { fromRequest, toRequest, type Draft } from "./draft";
import { freshDraft, PRESETS } from "./presets";
import { parseRequest, imageUrls, type DecisionRequest } from "./request";
import { ApiError, DecisionRun } from "./response";

export type Result =
  | { status: "idle" | "running" }
  | { status: "error"; message: string }
  | { status: "success"; run: DecisionRun; request: DecisionRequest };
type Session = {
  draft: Draft;
  json: string;
  mode: "form" | "json";
  error: string;
  result: Result;
};

function freshSession(index: number): Session {
  const draft = freshDraft(index);
  return {
    draft,
    json: JSON.stringify(toRequest(draft), null, 2),
    mode: "form",
    error: "",
    result: { status: "idle" },
  };
}

export function usePlayground() {
  const [active, setActive] = useState(0);
  const [sessions, setSessions] = useState(() =>
    PRESETS.map((_, index) => freshSession(index)),
  );
  const controller = useRef<AbortController | null>(null);
  const session = sessions[active];
  const pending = session.result.status === "running";
  useEffect(() => () => controller.current?.abort(), []);

  function update(patch: Partial<Session>, index = active) {
    setSessions((previous) =>
      previous.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function editDraft(patch: Partial<Draft>) {
    setSessions((previous) =>
      previous.map((item, index): Session =>
        index === active
          ? {
              ...item,
              draft: { ...item.draft, ...patch },
              error: "",
              result: { status: "idle" },
            }
          : item,
      ),
    );
  }

  function changeMode(mode: "form" | "json") {
    if (mode === session.mode) return;
    try {
      if (mode === "json")
        update({
          mode,
          json: JSON.stringify(toRequest(session.draft), null, 2),
          error: "",
        });
      else
        update({
          mode,
          draft: fromRequest(parseRequest(JSON.parse(session.json))),
          error: "",
        });
    } catch (error) {
      update({
        error:
          error instanceof SyntaxError
            ? "Fix the JSON syntax before opening the form."
            : error instanceof Error
              ? error.message
              : "Check the request fields.",
      });
    }
  }

  async function run() {
    if (controller.current) return;
    let request: DecisionRequest;
    try {
      request = parseRequest(
        session.mode === "json"
          ? JSON.parse(session.json)
          : toRequest(session.draft),
      );
      if (PRESETS[active].image && imageUrls(request.state).length === 0)
        throw new Error("Upload an image for this scenario.");
    } catch (error) {
      update({
        error:
          error instanceof SyntaxError
            ? "Fix the JSON syntax, then run again."
            : error instanceof Error
              ? error.message
              : "Check the request fields.",
      });
      return;
    }
    const activeController = new AbortController();
    controller.current = activeController;
    update({
      draft: fromRequest(request),
      error: "",
      result: { status: "running" },
    });
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.any([
          activeController.signal,
          AbortSignal.timeout(30_000),
        ]),
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
      if (Option.isNone(result))
        throw new Error("The server returned an invalid response. Try again.");
      if (!activeController.signal.aborted)
        update({ result: { status: "success", run: result.value, request } });
    } catch (error) {
      if (!activeController.signal.aborted)
        update({
          result: {
            status: "error",
            message:
              error instanceof Error && error.name === "TimeoutError"
                ? "The request timed out. Try again."
                : error instanceof SyntaxError
                  ? "The server returned unreadable JSON. Try again."
                  : error instanceof Error
                    ? error.message
                    : "Could not connect. Check your connection and try again.",
          },
        });
    } finally {
      if (controller.current === activeController) controller.current = null;
    }
  }

  function cancel() {
    controller.current?.abort();
    controller.current = null;
    update({ result: { status: "idle" } });
  }

  return {
    active,
    session,
    pending,
    select: (index: number) => {
      if (!controller.current) setActive(index);
    },
    editDraft,
    changeMode,
    editJson: (json: string) =>
      update({ json, error: "", result: { status: "idle" } }),
    reset: () => update(freshSession(active)),
    run,
    cancel,
  };
}
