import { JsonOutput } from "@/features/decisions/components/json-output";
import type { useArcadeDecision } from "../use-arcade-decision";

export function GuessResult({
  decision,
  labels,
  expected,
  idle,
}: {
  decision: ReturnType<typeof useArcadeDecision>;
  labels: Record<string, string>;
  expected: string;
  idle: string;
}) {
  const result = decision.result;
  const probability = result?.answer.probabilities?.[result.answer.choice];
  return (
    <section
      className="min-h-50 min-w-0 rounded-xl border border-border bg-card p-6"
      aria-label="Jev’s answer"
      aria-busy={decision.pending}
    >
      <p className="mb-7 font-mono text-xs leading-normal text-muted-foreground">
        Jev 1.14
      </p>
      <p role="status" className="sr-only">
        {decision.pending
          ? "Waiting for Jev"
          : result
            ? `Jev chose ${labels[result.answer.choice] ?? result.answer.choice}. ${result.answer.choice === expected ? "Correct." : "Incorrect."}`
            : ""}
      </p>
      {decision.error && (
        <p role="alert" className="text-sm text-destructive">
          {decision.error}
        </p>
      )}
      {decision.pending && (
        <p className="max-w-[30ch] py-6 text-sm leading-[1.6] text-muted-foreground">
          Jev is deciding…
        </p>
      )}
      {!decision.pending && !result && !decision.error && (
        <p className="max-w-[30ch] py-6 text-sm leading-[1.6] text-muted-foreground">
          {idle}
        </p>
      )}
      {result && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.2] font-medium tracking-tight wrap-anywhere">
              {labels[result.answer.choice] ?? result.answer.choice}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.answer.choice === expected
                ? "Got it right."
                : `Not quite. It’s ${labels[expected] ?? expected}.`}
            </p>
          </div>
          {probability !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                <span>Choice probability</span>
                <span className="tabular-nums">
                  {new Intl.NumberFormat("en-US", {
                    style: "percent",
                    maximumFractionDigits: 1,
                  }).format(probability)}
                </span>
              </div>
              <meter
                className="probability-meter is-selected"
                min={0}
                max={1}
                value={probability}
                aria-label="Probability of Jev’s chosen answer"
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            {result.run.durationMs.toLocaleString("en-US")} ms
            {result.run.response.usage.cost !== undefined &&
              ` · $${result.run.response.usage.cost.toFixed(6)}`}
          </p>
          <details className="text-xs leading-normal text-muted-foreground">
            <summary className="min-h-8 w-fit cursor-pointer py-2">
              Response JSON
            </summary>
            <div className="mt-4">
              <JsonOutput value={result.run.rawResponse} />
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
