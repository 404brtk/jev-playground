import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Result } from "../use-playground";
import { AnswerPreview } from "./answer-preview";
import { JsonOutput } from "./json-output";

export function ResultPane({ result }: { result: Result }) {
  return (
    <section
      aria-label="Decision output"
      className="min-h-160 min-w-0 bg-card p-6 max-[960px]:min-h-120 max-sm:px-4 max-sm:py-5"
      aria-busy={result.status === "running"}
    >
      <Tabs defaultValue="preview" className="h-full gap-0">
        <div className="mb-6 flex min-h-9 items-center justify-between gap-4">
          <h2 className="text-[0.8125rem] leading-[1.3] font-medium text-muted-foreground">
            Output
          </h2>
          <TabsList aria-label="Output format">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </div>
        <p role="status" className="sr-only">
          {result.status === "running"
            ? "Running decision"
            : result.status === "success"
              ? "Decision complete"
              : ""}
        </p>
        {result.status !== "success" && (
          <div className="flex min-h-105 flex-1 items-center justify-center p-8 text-center text-[0.8125rem] text-muted-foreground">
            {result.status === "error" ? (
              <p role="alert" className="max-w-md text-sm text-destructive">
                {result.message}
              </p>
            ) : result.status === "running" ? (
              "Running…"
            ) : (
              "Run a decision to see the result."
            )}
          </div>
        )}
        {result.status === "success" && (
          <>
            <TabsContent
              value="preview"
              className="mx-auto w-full max-w-170 px-4 py-8 max-sm:px-0 max-sm:py-5"
            >
              <AnswerPreview
                answer={Object.values(result.run.response.answers)[0]}
                question={Object.values(result.request.questions)[0]}
                state={result.request.state}
              />
            </TabsContent>
            <TabsContent
              value="json"
              className="mx-auto w-full max-w-170 px-4 py-8 max-sm:px-0 max-sm:py-5"
            >
              <JsonOutput value={result.run.rawResponse} />
            </TabsContent>
            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-xs text-muted-foreground tabular-nums">
              <span>{result.run.durationMs.toLocaleString("en-US")} ms</span>
              <span>
                {(
                  result.run.response.usage.input_tokens +
                  result.run.response.usage.output_tokens
                ).toLocaleString("en-US")}{" "}
                tokens
              </span>
              {result.run.response.usage.cost !== undefined && (
                <span>${result.run.response.usage.cost.toFixed(8)}</span>
              )}
              <span className="break-all">{result.run.response.model}</span>
            </div>
          </>
        )}
      </Tabs>
    </section>
  );
}
