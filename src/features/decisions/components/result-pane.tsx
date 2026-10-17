import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Result } from "../use-playground";
import { AnswerPreview } from "./answer-preview";
import { JsonOutput } from "./json-output";

export function ResultPane({ result }: { result: Result }) {
  return (
    <section
      aria-label="Decision output"
      className="result-pane"
      aria-busy={result.status === "running"}
    >
      <Tabs defaultValue="preview" className="h-full gap-0">
        <div className="pane-toolbar">
          <h2>Output</h2>
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
        {result.status === "idle" && (
          <div className="result-empty">Run a decision to see the result.</div>
        )}
        {result.status === "running" && (
          <div className="result-empty">Running…</div>
        )}
        {result.status === "error" && (
          <div className="result-empty">
            <p role="alert" className="max-w-md text-sm text-destructive">
              {result.message}
            </p>
          </div>
        )}
        {result.status === "success" && (
          <>
            <TabsContent value="preview" className="result-content">
              <AnswerPreview
                answer={Object.values(result.run.response.answers)[0]}
                question={Object.values(result.request.questions)[0]}
                state={result.request.state}
              />
            </TabsContent>
            <TabsContent value="json" className="result-content">
              <JsonOutput value={result.run.rawResponse} />
            </TabsContent>
            <div className="result-metrics">
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
