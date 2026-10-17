import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RunButton } from "@/components/run-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PRESETS } from "../presets";
import type { usePlayground } from "../use-playground";
import { CriteriaEditor } from "./criteria-editor";
import { ImageField } from "./image-field";

export function RequestEditor({
  playground,
  configured,
}: {
  playground: ReturnType<typeof usePlayground>;
  configured: boolean;
}) {
  const { session, pending, editDraft } = playground;
  const { draft } = session;
  const error = useRef<HTMLParagraphElement>(null);
  const [readingImage, setReadingImage] = useState(false);
  useEffect(() => {
    if (session.error) error.current?.focus();
  }, [session.error]);

  return (
    <section
      aria-label="Decision input"
      className="min-w-0 border-e border-border p-6 max-[960px]:border-e-0 max-[960px]:border-b max-sm:px-4 max-sm:py-5"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (configured && !readingImage) void playground.run();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            event.currentTarget.requestSubmit();
          }
        }}
      >
        <Tabs
          value={session.mode}
          onValueChange={(value) =>
            playground.changeMode(value === "json" ? "json" : "form")
          }
        >
          <div className="mb-6 flex min-h-9 items-center justify-between gap-4">
            <h2 className="text-[0.8125rem] leading-[1.3] font-medium text-muted-foreground">
              Input
            </h2>
            <TabsList aria-label="Input format">
              <TabsTrigger value="form" disabled={pending || readingImage}>
                Form
              </TabsTrigger>
              <TabsTrigger value="json" disabled={pending || readingImage}>
                JSON
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="form">
            <fieldset disabled={pending} className="grid gap-6">
              <label className="block text-[0.8125rem] leading-normal font-medium">
                State
                {draft.stateFormat === "json" && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · JSON
                  </span>
                )}
                <Textarea
                  name="state"
                  value={draft.state}
                  required
                  maxLength={draft.stateFormat === "text" ? 12000 : undefined}
                  onChange={(event) => editDraft({ state: event.target.value })}
                  className="mt-2 min-h-36"
                />
              </label>
              {(PRESETS[playground.active].image ||
                draft.image ||
                draft.type === "box") && (
                <ImageField
                  value={draft.image}
                  onChange={(image) => editDraft({ image })}
                  onReadingChange={setReadingImage}
                />
              )}
              <label className="block text-[0.8125rem] leading-normal font-medium">
                Question
                <Textarea
                  name="question"
                  value={draft.instructions}
                  required
                  maxLength={12000}
                  onChange={(event) =>
                    editDraft({ instructions: event.target.value })
                  }
                  className="mt-2 min-h-20"
                />
              </label>
              <CriteriaEditor
                draft={draft}
                onChange={editDraft}
                error={session.error}
              />
            </fieldset>
          </TabsContent>
          <TabsContent value="json">
            <label htmlFor="request-json" className="sr-only">
              Decision request JSON
            </label>
            <Textarea
              id="request-json"
              value={session.json}
              disabled={pending}
              spellCheck={false}
              aria-invalid={Boolean(session.error)}
              aria-describedby={session.error ? "request-error" : undefined}
              onChange={(event) => playground.editJson(event.target.value)}
              className="min-h-140 font-mono"
            />
          </TabsContent>
        </Tabs>
        {session.error && (
          <p
            ref={error}
            tabIndex={-1}
            id="request-error"
            role="alert"
            className="mt-4 text-sm text-destructive focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {session.error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || readingImage}
            onClick={playground.reset}
          >
            Reset
          </Button>
          {pending ? (
            <Button type="button" variant="outline" onClick={playground.cancel}>
              Cancel
            </Button>
          ) : (
            <RunButton type="submit" disabled={!configured || readingImage}>
              Run decision
            </RunButton>
          )}
        </div>
        {!configured && (
          <p className="mt-4 text-xs leading-normal text-muted-foreground">
            Set <code>OPENROUTER_API_KEY</code> in <code>.env.local</code> to
            run.
          </p>
        )}
      </form>
    </section>
  );
}
