"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRESETS } from "../presets";
import { usePlayground } from "../use-playground";
import { RequestEditor } from "./request-editor";
import { ResultPane } from "./result-pane";

export function DecisionPlayground({ configured }: { configured: boolean }) {
  const playground = usePlayground();
  return (
    <main className="playground-shell">
      <h1 className="sr-only">Jev playground</h1>
      <Tabs
        value={String(playground.active)}
        onValueChange={(value) => playground.select(Number(value))}
        className="workbench gap-0"
      >
        <div className="scenario-toolbar">
          <TabsList
            aria-label="Scenario"
            className="scenario-tabs"
            variant="line"
          >
            {PRESETS.map((preset, index) => (
              <TabsTrigger
                key={preset.id}
                value={String(index)}
                disabled={playground.pending}
              >
                <span className="scenario-type">{preset.type}</span>
                {preset.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="model-label">Jev 1.14</span>
        </div>
        {PRESETS.map((preset, index) => (
          <TabsContent key={preset.id} value={String(index)}>
            {playground.active === index && (
              <div className="workspace-grid">
                <RequestEditor
                  playground={playground}
                  configured={configured}
                />
                <ResultPane result={playground.session.result} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
