"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { evenRequest, parseInteger } from "../requests";
import { useArcadeDecision } from "../use-arcade-decision";
import { DecisionControls } from "./decision-controls";
import { GuessResult } from "./guess-result";

const examples = ["0", "-7", "42", "9007199254740993", "12345678901234567890"];

export function EvenGame({ configured }: { configured: boolean }) {
  const [number, setNumber] = useState("42");
  const [expected, setExpected] = useState("even");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const decision = useArcadeDecision();
  function edit(value: string) {
    setNumber(value);
    setError("");
    decision.reset();
  }
  function check() {
    if (decision.pending || !configured) return;
    try {
      const integer = parseInteger(number);
      setExpected(integer.even ? "even" : "odd");
      setError("");
      void decision.run(() => evenRequest(number));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Enter a whole number.",
      );
      input.current?.focus();
    }
  }
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-12 max-[760px]:grid-cols-1 max-[760px]:gap-8">
      <form
        className="min-w-0 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <label htmlFor="integer" className="text-sm">
          Pick a number
        </label>
        <input
          ref={input}
          id="integer"
          name="integer"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={257}
          className="mt-5 mb-3 block w-full min-w-0 rounded-xl border border-input bg-card p-5 font-mono text-[clamp(1.25rem,3vw,2rem)] leading-[1.3] text-foreground tabular-nums"
          value={number}
          disabled={decision.pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "integer-error" : "integer-hint"}
          onChange={(event) => edit(event.target.value)}
        />
        <p id="integer-hint" className="text-xs text-muted-foreground">
          Whole numbers only. Go big if you like.
        </p>
        {error && (
          <p
            id="integer-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="my-8 flex flex-wrap gap-2" aria-label="Example numbers">
          {examples.map((value) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              className="font-mono tabular-nums"
              disabled={decision.pending}
              onClick={() => edit(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <DecisionControls
          configured={configured}
          pending={decision.pending}
          label="Ask Jev"
          onRun={check}
          onCancel={decision.reset}
        />
      </form>
      <div className="min-w-0 space-y-5">
        <GuessResult
          decision={decision}
          labels={{ even: "Even", odd: "Odd" }}
          expected={expected}
          idle="Will Jev overthink this? Only one way to find out."
        />
        {decision.result && (
          <p className="text-sm text-muted-foreground">
            Exact answer:{" "}
            <strong className="font-medium text-foreground">
              {expected === "even" ? "Even" : "Odd"}
            </strong>
            . Checked with integer arithmetic.
          </p>
        )}
      </div>
    </div>
  );
}
