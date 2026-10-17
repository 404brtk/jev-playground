"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRESETS } from "../presets";
import { usePlayground } from "../use-playground";
import { RequestEditor } from "./request-editor";
import { ResultPane } from "./result-pane";

export function DecisionPlayground({ configured }: { configured: boolean }) {
  const playground = usePlayground();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-360 px-3 py-4 sm:px-8 sm:pt-6 sm:pb-10"
    >
      <h1 className="sr-only">Jev playground</h1>
      <Tabs
        value={String(playground.active)}
        onValueChange={(value) => playground.select(Number(value))}
        className="gap-0 overflow-clip rounded-xl border border-border"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-2 sm:px-4 sm:py-2.5">
          <TabsList
            aria-label="Scenario"
            className="h-auto w-auto flex-wrap justify-start gap-1 p-0 group-data-horizontal/tabs:h-auto"
            variant="line"
          >
            {PRESETS.map((preset, index) => (
              <TabsTrigger
                key={preset.id}
                value={String(index)}
                disabled={playground.pending}
                className="min-h-10 flex-initial gap-2 px-2 py-2 text-[0.8125rem] after:hidden sm:px-3"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {preset.type}
                </span>
                {preset.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="text-xs whitespace-nowrap text-muted-foreground max-sm:px-2">
            Jev 1.14
          </span>
        </div>
        {PRESETS.map((preset, index) => (
          <TabsContent key={preset.id} value={String(index)}>
            {playground.active === index && (
              <div className="grid grid-cols-[minmax(0,440px)_minmax(0,1fr)] max-[960px]:grid-cols-1">
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
