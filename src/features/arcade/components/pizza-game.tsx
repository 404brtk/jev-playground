"use client";

import Image from "next/image";
import { useState } from "react";
import { PIZZA_SAMPLES, loadSampleImage } from "../pizza-samples";
import { pizzaRequest } from "../requests";
import { useArcadeDecision } from "../use-arcade-decision";
import { DecisionControls } from "./decision-controls";
import { GuessResult } from "./guess-result";

export function PizzaGame({ configured }: { configured: boolean }) {
  const [selected, setSelected] = useState(0);
  const decision = useArcadeDecision();
  const sample = PIZZA_SAMPLES[selected];
  return (
    <div className="grid grid-cols-[minmax(0,min(var(--arcade-media-size),55%))_minmax(0,1fr)] items-start gap-8 [--arcade-media-size:clamp(240px,calc(100svh-280px),560px)] max-[760px]:grid-cols-1">
      <section
        className="min-w-0 max-[760px]:w-full max-[760px]:max-w-(--arcade-media-size)"
        aria-label="Food samples"
      >
        <div className="overflow-hidden rounded-xl">
          <Image
            src={sample.src}
            alt={sample.alt}
            width={1254}
            height={1254}
            sizes="(max-width: 760px) 100vw, 560px"
            className="h-auto w-full"
          />
        </div>
      </section>
      <div className="flex min-w-0 flex-col items-stretch gap-4">
        <div
          className="grid grid-cols-[repeat(4,minmax(0,96px))] gap-2"
          aria-label="Choose a sample"
        >
          {PIZZA_SAMPLES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="flex min-w-0 flex-col items-stretch rounded-lg border border-transparent p-1.25 text-start hover:bg-muted disabled:cursor-wait aria-pressed:border-primary aria-pressed:bg-muted"
              disabled={decision.pending}
              aria-pressed={index === selected}
              aria-label={`Select ${item.label}`}
              onClick={() => {
                setSelected(index);
                decision.reset();
              }}
            >
              <Image
                src={item.src}
                alt=""
                width={84}
                height={84}
                sizes="84px"
                className="aspect-square h-auto w-full rounded-md object-cover"
              />
              <span className="mt-2 block text-center text-xs leading-normal wrap-anywhere">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <DecisionControls
          configured={configured}
          pending={decision.pending}
          label="Is this pizza?"
          onRun={() =>
            void decision.run(async (signal) =>
              pizzaRequest(await loadSampleImage(sample.src, signal)),
            )
          }
          onCancel={decision.reset}
        />
        <GuessResult
          decision={decision}
          labels={{ pizza: "Pizza", not_pizza: "Not pizza" }}
          expected={sample.expected}
          idle="Select a photo. Put Jev’s culinary expertise to the test."
        />
        <p className="text-xs text-muted-foreground">
          Four AI-generated photos. Only the image is sent to Jev.
        </p>
      </div>
    </div>
  );
}
