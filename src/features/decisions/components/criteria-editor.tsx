import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { Draft } from "../draft";

export function CriteriaEditor({
  draft,
  onChange,
  error,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  error: string;
}) {
  if (draft.type === "noul")
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.8125rem] leading-normal font-medium">
          True when
          <Textarea
            value={draft.trueWhen}
            onChange={(event) => onChange({ trueWhen: event.target.value })}
            maxLength={2000}
            className="mt-2 min-h-28"
          />
        </label>
        <label className="block text-[0.8125rem] leading-normal font-medium">
          False when
          <Textarea
            value={draft.falseWhen}
            onChange={(event) => onChange({ falseWhen: event.target.value })}
            maxLength={2000}
            className="mt-2 min-h-28"
          />
        </label>
      </div>
    );
  if (draft.type === "choice")
    return (
      <fieldset className="space-y-3">
        <legend className="mb-3 block text-[0.8125rem] leading-normal font-medium">
          Options
        </legend>
        <div
          className="grid grid-cols-[72px_minmax(0,1fr)_32px] gap-2 text-xs text-muted-foreground sm:grid-cols-[96px_minmax(0,1fr)_32px]"
          aria-hidden="true"
        >
          <span>Value</span>
          <span>Choose when</span>
        </div>
        {draft.choices.map((option, index) => (
          <div
            key={option.id}
            className="grid grid-cols-[72px_minmax(0,1fr)_32px] items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)_32px]"
          >
            <label className="min-w-0">
              <span className="sr-only">Option {index + 1} value</span>
              <Input
                className="font-mono"
                value={option.value}
                required
                maxLength={64}
                aria-invalid={
                  Boolean(error) &&
                  (draft.choices.filter(
                    (item) => item.value.trim() === option.value.trim(),
                  ).length > 1 ||
                    !/^[a-zA-Z0-9_-]{1,64}$/.test(option.value.trim()))
                }
                aria-describedby={error ? "request-error" : undefined}
                onChange={(event) =>
                  onChange({
                    choices: draft.choices.map((item) =>
                      item.id === option.id
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <label className="min-w-0">
              <span className="sr-only">Option {index + 1} description</span>
              <Textarea
                className="min-h-16"
                value={option.description ?? ""}
                maxLength={2000}
                onChange={(event) =>
                  onChange({
                    choices: draft.choices.map((item) =>
                      item.id === option.id
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove option ${index + 1}`}
              disabled={draft.choices.length <= 2}
              onClick={() =>
                onChange({
                  choices: draft.choices.filter(
                    (item) => item.id !== option.id,
                  ),
                })
              }
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={draft.choices.length >= 32}
          onClick={() =>
            onChange({
              choices: [
                ...draft.choices,
                { id: crypto.randomUUID(), value: "", description: "" },
              ],
            })
          }
        >
          Add option
        </Button>
      </fieldset>
    );
  if (draft.type === "score")
    return (
      <fieldset className="space-y-3">
        <legend className="mb-3 block text-[0.8125rem] leading-normal font-medium">
          Levels · lowest to highest
        </legend>
        {draft.levels.map((level, index) => (
          <div key={level.id} className="flex items-start gap-3">
            <span
              className="pt-2.5 font-mono text-xs text-muted-foreground"
              aria-hidden="true"
            >
              {index}
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Level {index}</span>
              <Textarea
                value={level.description}
                required
                maxLength={2000}
                className="min-h-16"
                onChange={(event) =>
                  onChange({
                    levels: draft.levels.map((item) =>
                      item.id === level.id
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove level ${index}`}
              disabled={draft.levels.length <= 2}
              onClick={() =>
                onChange({
                  levels: draft.levels.filter((item) => item.id !== level.id),
                })
              }
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={draft.levels.length >= 10}
          onClick={() =>
            onChange({
              levels: [
                ...draft.levels,
                { id: crypto.randomUUID(), description: "" },
              ],
            })
          }
        >
          Add level
        </Button>
      </fieldset>
    );
  return null;
}
