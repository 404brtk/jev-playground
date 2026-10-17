"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  constrainPoint,
  drawingImage,
  DRAWING_SIZE,
  paintDrawing,
  type Point,
  type Stroke,
} from "./drawing";

export function useDrawing(disabled: boolean, onChange: () => void) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const pointer = useRef<number | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<Point>({ x: 320, y: 320 });
  const [keyboard, setKeyboard] = useState(false);
  const [penDown, setPenDown] = useState(false);

  const repaint = useCallback(
    (element: HTMLCanvasElement | null, next: Stroke[]) => {
      if (!element) return;
      try {
        paintDrawing(element, next);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not open the canvas. Reload the page.",
        );
      }
    },
    [],
  );
  const attachCanvas = useCallback(
    (element: HTMLCanvasElement | null) => {
      canvas.current = element;
      repaint(element, strokes.current);
    },
    [repaint],
  );

  function update(next: Stroke[]) {
    strokes.current = next;
    repaint(canvas.current, next);
    setHasInk(next.length > 0);
    onChange();
  }
  function append(point: Point) {
    const current = strokes.current;
    if (current.length)
      update([
        ...current.slice(0, -1),
        [...current[current.length - 1], point],
      ]);
  }
  function pointAt(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return constrainPoint(
      ((event.clientX - rect.left) * DRAWING_SIZE) / rect.width,
      ((event.clientY - rect.top) * DRAWING_SIZE) / rect.height,
    );
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || pointer.current !== null || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    setKeyboard(false);
    setPenDown(false);
    update([...strokes.current, [pointAt(event)]]);
  }
  function keyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction && ![" ", "Enter", "Escape"].includes(event.key)) return;
    event.preventDefault();
    setKeyboard(true);
    if (direction) {
      const distance = event.shiftKey ? 20 : 5;
      const next = constrainPoint(
        cursor.x + direction[0] * distance,
        cursor.y + direction[1] * distance,
      );
      setCursor(next);
      if (penDown) append(next);
    } else if (event.key === " " && !event.repeat) {
      if (!penDown) update([...strokes.current, [cursor]]);
      setPenDown(!penDown);
    } else if (event.key === "Enter") update([...strokes.current, [cursor]]);
    else if (event.key === "Escape") setPenDown(false);
  }

  return {
    hasInk,
    error,
    cursor,
    keyboard,
    penDown,
    image: () => drawingImage(strokes.current),
    undo: () => {
      setPenDown(false);
      update(strokes.current.slice(0, -1));
    },
    clear: () => {
      setPenDown(false);
      update([]);
    },
    canvasProps: {
      ref: attachCanvas,
      onPointerDown: start,
      onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => {
        if (!disabled && pointer.current === event.pointerId)
          append(pointAt(event));
      },
      onPointerUp: (event: PointerEvent<HTMLCanvasElement>) => {
        if (pointer.current === event.pointerId) pointer.current = null;
      },
      onLostPointerCapture: () => {
        pointer.current = null;
      },
      onPointerCancel: () => {
        pointer.current = null;
      },
      onKeyDown: keyDown,
      onFocus: () => setKeyboard(true),
      onBlur: () => {
        setKeyboard(false);
        setPenDown(false);
      },
    },
  };
}
