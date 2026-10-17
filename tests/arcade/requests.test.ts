import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  DRAW_WORDS,
  drawingRequest,
  evenRequest,
  parseInteger,
  pizzaRequest,
} from "@/features/arcade/requests";
import { PIZZA_SAMPLES } from "@/features/arcade/pizza-samples";
import { constrainPoint } from "@/features/arcade/drawing";
import { MAX_IMAGE_BYTES, parseRequest } from "@/features/decisions/request";

describe("arcade requests", () => {
  test("drawing offers every word without disclosing the player's chosen word", () => {
    const image = "data:image/png;base64,YQ==";
    const request = parseRequest(drawingRequest(image));
    expect(request.state).toEqual([
      { type: "image_url", image_url: { url: image } },
    ]);
    const question = request.questions.decision;
    expect(question.type).toBe("choice");
    if (question.type !== "choice") throw new Error("Expected choice");
    expect(Object.keys(question.criteria)).toEqual(DRAW_WORDS);
    expect(
      Object.values(question.criteria).every((value) => value === null),
    ).toBe(true);
  });

  test.each<[string, boolean]>([
    ["0", true],
    ["-7", false],
    ["+002", true],
    ["9007199254740993", false],
    ["12345678901234567890", true],
    ["9".repeat(256), false],
  ])("checks %s without floating-point rounding", (number, even) => {
    expect(parseInteger(number).even).toBe(even);
    const request = parseRequest(evenRequest(number));
    expect(request.state).toEqual({ number });
    expect(request.state).not.toHaveProperty("even");
  });
  test.each([
    "",
    " ",
    "1.5",
    "1e10",
    "Infinity",
    "--2",
    "1,000",
    "9".repeat(257),
  ])("rejects invalid integer %s", (number) =>
    expect(() => evenRequest(number)).toThrow("whole number"),
  );

  test("pizza input contains pixels without filenames or expected answers", () => {
    const image = "data:image/png;base64,YQ==";
    const request = parseRequest(pizzaRequest(image));
    expect(request.state).toEqual([
      { type: "image_url", image_url: { url: image } },
    ]);
    expect(request.questions.decision).toMatchObject({
      type: "choice",
      criteria: { pizza: expect.any(String), not_pizza: expect.any(String) },
    });
  });

  test.each(PIZZA_SAMPLES)(
    "generated sample $id fits the upload contract",
    async (sample) => {
      const bytes = await readFile(
        new URL(`../../public${sample.src}`, import.meta.url),
      );
      const info = await sharp(bytes).metadata();
      expect(info.format).toBe("png");
      expect(bytes.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
      expect(info.width).toBeGreaterThanOrEqual(256);
      expect(info.height).toBeGreaterThanOrEqual(256);
      expect(info.width).toBeLessThanOrEqual(1568);
      expect(info.height).toBeLessThanOrEqual(1568);
      expect(info.width * info.height).toBeGreaterThanOrEqual(78_400);
    },
  );

  test("pointer and keyboard positions stay within the drawing", () => {
    expect(constrainPoint(-10, 900)).toEqual({ x: 0, y: 640 });
    expect(constrainPoint(320, 100)).toEqual({ x: 320, y: 100 });
  });
});
