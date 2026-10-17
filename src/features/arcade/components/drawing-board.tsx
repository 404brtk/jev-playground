"use client";

import { useId, useImperativeHandle, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { DRAWING_SIZE } from "../drawing";
import { useDrawing } from "../use-drawing";

export type DrawingHandle = { image: () => string };

export function DrawingBoard({
  ref,
  disabled,
  onChange,
}: {
  ref: Ref<DrawingHandle>;
  disabled: boolean;
  onChange: () => void;
}) {
  const drawing = useDrawing(disabled, onChange);
  const { hasInk, cursor, keyboard, penDown, error } = drawing;
  const help = useId();
  useImperativeHandle(ref, () => ({ image: drawing.image }), [drawing.image]);

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-xl bg-white has-[canvas:focus-visible]:outline-2 has-[canvas:focus-visible]:outline-offset-4 has-[canvas:focus-visible]:outline-ring forced-colors:has-[canvas:focus-visible]:outline-[Highlight]"
        role="application"
        aria-label="Drawing editor"
      >
        <canvas
          {...drawing.canvasProps}
          className="block h-auto w-full touch-none cursor-crosshair aria-disabled:cursor-wait"
          width={DRAWING_SIZE}
          height={DRAWING_SIZE}
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label="Drawing canvas"
          aria-describedby={help}
        />
        {!hasInk && (
          <span
            className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[#525252]"
            aria-hidden="true"
          >
            Make your masterpiece.
          </span>
        )}
        {keyboard && !disabled && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#171717] ${penDown ? "bg-[#171717]" : ""}`}
            style={{
              left: `${(cursor.x / DRAWING_SIZE) * 100}%`,
              top: `${(cursor.y / DRAWING_SIZE) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <details className="min-w-[140px] flex-1 text-xs leading-normal text-muted-foreground open:basis-full">
          <summary className="min-h-8 w-fit cursor-pointer py-2">
            Keyboard controls
          </summary>
          <p id={help} className="mt-2 text-xs text-muted-foreground">
            Arrow keys move the cursor. Space starts or stops a line. Enter adds
            a dot. Shift + arrows move faster. Escape lifts the pen.
          </p>
        </details>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || !hasInk}
            onClick={drawing.undo}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || !hasInk}
            onClick={drawing.clear}
          >
            Clear
          </Button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {keyboard ? (penDown ? "Pen down" : "Pen up") : ""}
      </span>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
