export const DRAWING_SIZE = 640;
export type Point = { x: number; y: number };
export type Stroke = Point[];

export function constrainPoint(x: number, y: number): Point {
  return {
    x: Math.max(0, Math.min(DRAWING_SIZE, x)),
    y: Math.max(0, Math.min(DRAWING_SIZE, y)),
  };
}

export function paintDrawing(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error(
      "Canvas is unavailable. Try a browser with canvas support.",
    );
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, DRAWING_SIZE, DRAWING_SIZE);
  context.strokeStyle = "#171717";
  context.fillStyle = "#171717";
  context.lineWidth = 7;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    context.beginPath();
    if (stroke.length === 1) {
      context.arc(stroke[0].x, stroke[0].y, 3.5, 0, Math.PI * 2);
      context.fill();
    } else {
      context.moveTo(stroke[0].x, stroke[0].y);
      for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
      context.stroke();
    }
  }
}

export function drawingImage(strokes: Stroke[]): string {
  if (strokes.length === 0)
    throw new Error("Draw something before asking Jev to guess.");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = DRAWING_SIZE;
  paintDrawing(canvas, strokes);
  return canvas.toDataURL("image/png");
}
