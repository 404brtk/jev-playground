"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_BYTES } from "../request";

export function ImageField({
  value,
  onChange,
  onReadingChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  onReadingChange: (reading: boolean) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function read(file: File | undefined) {
    if (!file) return;
    if (input.current) input.current.value = "";
    setError("");
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > MAX_IMAGE_BYTES
    ) {
      setError("Choose a PNG or JPEG smaller than 5 MiB.");
      return;
    }
    setReading(true);
    onReadingChange(true);
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (
        width < 256 ||
        height < 256 ||
        width > 1568 ||
        height > 1568 ||
        width * height < 78_400
      )
        throw new Error(
          "Use 256-1,568 px per side and at least 78,400 pixels total.",
        );
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Could not read the image. Try another file."));
        reader.onerror = () =>
          reject(new Error("Could not read the image. Try another file."));
        reader.readAsDataURL(file);
      });
      if (mounted.current) onChange(url);
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error && /^(Use|Could not) /.test(cause.message)
            ? cause.message
            : "Could not read the image. Try another file.",
        );
    } finally {
      if (mounted.current) {
        setReading(false);
        onReadingChange(false);
      }
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="field-label">
        Image
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        tabIndex={-1}
        disabled={reading}
        aria-describedby={`${id}-hint ${id}-error`}
        aria-invalid={Boolean(error)}
        onChange={(event) => void read(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center gap-3">
        {value && (
          <Image
            src={value}
            alt="Selected image"
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-md object-cover"
          />
        )}
        <Button
          type="button"
          variant="outline"
          disabled={reading}
          onClick={() => input.current?.click()}
        >
          {reading
            ? "Reading image…"
            : value
              ? "Replace image"
              : "Upload image"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            disabled={reading}
            onClick={() => {
              onChange(null);
              setError("");
            }}
          >
            Remove
          </Button>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        PNG or JPEG · up to 5 MiB
      </p>
      <p id={`${id}-error`} role="status" className="text-sm text-destructive">
        {error}
      </p>
    </div>
  );
}
