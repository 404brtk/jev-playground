"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DRAW_WORDS, drawingRequest } from "../requests";
import { useArcadeDecision } from "../use-arcade-decision";
import { DrawingBoard, type DrawingHandle } from "./drawing-board";
import { DecisionControls } from "./decision-controls";
import { GuessResult } from "./guess-result";

const labels = Object.fromEntries(
  DRAW_WORDS.map((word) => [word, word[0].toUpperCase() + word.slice(1)]),
);

export function DrawGame({ configured }: { configured: boolean }) {
  const [word, setWord] = useState(DRAW_WORDS[0]);
  const [history, setHistory] = useState<string[]>([]);
  const drawing = useRef<DrawingHandle>(null);
  const decision = useArcadeDecision();
  async function guess() {
    const result = await decision.run(() => {
      if (!drawing.current)
        throw new Error("The canvas is not ready. Reload the page.");
      return drawingRequest(drawing.current.image());
    });
    if (result)
      setHistory((previous) => [...previous.slice(-4), result.answer.choice]);
  }
  return (
    <div className="grid grid-cols-[minmax(0,min(var(--arcade-media-size),55%))_minmax(0,1fr)] items-start gap-8 [--arcade-media-size:clamp(240px,calc(100svh-360px),560px)] max-[760px]:grid-cols-1">
      <section
        aria-label="Your drawing"
        className="min-w-0 max-[760px]:w-full max-[760px]:max-w-(--arcade-media-size)"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="secret-word" className="text-sm">
            Draw a
          </label>
          <div className="relative">
            <select
              id="secret-word"
              name="secret-word"
              value={word}
              disabled={decision.pending}
              className="min-h-10 min-w-[150px] appearance-none rounded-lg border border-input bg-card px-3 py-2 pe-9 text-base text-foreground"
              onChange={(event) => {
                setWord(event.target.value);
                setHistory([]);
                decision.reset();
              }}
            >
              {DRAW_WORDS.map((option) => (
                <option key={option} value={option}>
                  {labels[option]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              size={16}
              strokeWidth={1.5}
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>
        <DrawingBoard
          key={word}
          ref={drawing}
          disabled={decision.pending}
          onChange={decision.reset}
        />
      </section>
      <div className="flex min-w-0 flex-col items-stretch gap-4">
        <DecisionControls
          configured={configured}
          pending={decision.pending}
          label="Guess my drawing"
          onRun={() => void guess()}
          onCancel={decision.reset}
        />
        <GuessResult
          decision={decision}
          labels={labels}
          expected={word}
          idle="Add a few lines, then let Jev take a guess."
        />
        <p className="text-xs text-muted-foreground">
          Jev sees the drawing and all 12 possible words. Your chosen word stays
          secret.
        </p>
        {history.length > 0 && (
          <section aria-label="Recent guesses" className="space-y-3">
            <h2 className="text-sm font-medium">Recent guesses</h2>
            <ol className="flex flex-wrap gap-2">
              {history.map((guess, index) => (
                <li
                  key={`${index}-${guess}`}
                  className="rounded-md bg-muted px-3 py-2 text-xs"
                >
                  {labels[guess]}
                  {guess === word ? " · correct" : ""}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
