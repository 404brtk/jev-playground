import Image from "next/image";
import { imageUrls, type Question } from "../request";
import type { Answer } from "../response";

function percent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function ProbabilityRow({
  label,
  value,
  selected,
}: {
  label: string;
  value: number;
  selected?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4 text-sm">
        <span className={selected ? "font-medium" : "text-muted-foreground"}>
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums">{percent(value)}</span>
      </div>
      <meter
        className={`probability-meter ${selected ? "is-selected" : ""}`}
        min={0}
        max={1}
        value={value}
        aria-label={label}
      >
        {percent(value)}
      </meter>
    </div>
  );
}

export function AnswerPreview({
  answer,
  question,
  state,
}: {
  answer: Answer;
  question: Question;
  state: unknown;
}) {
  const image = imageUrls(state)[0];
  if (answer.type === "box")
    return (
      <div className="space-y-6">
        {image && (
          <div className="relative overflow-hidden rounded-md">
            <Image
              src={image}
              alt="Uploaded image with the predicted bounding box"
              width={1568}
              height={1568}
              unoptimized
              className="h-auto w-full"
            />
            <div
              className="pointer-events-none absolute border-2 border-primary"
              style={{
                left: `${answer.box.left * 100}%`,
                top: `${answer.box.top * 100}%`,
                width: `${(answer.box.right - answer.box.left) * 100}%`,
                height: `${(answer.box.bottom - answer.box.top) * 100}%`,
              }}
            />
          </div>
        )}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {Object.entries(answer.box).map(([edge, value]) => (
            <div key={edge}>
              <dt className="capitalize text-muted-foreground">{edge}</dt>
              <dd className="mt-1 font-mono tabular-nums">
                {value.toFixed(3)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          A box prediction does not confirm the target is present.
        </p>
        {answer.confidence !== undefined && (
          <p className="text-xs text-muted-foreground">
            Confidence {percent(answer.confidence)}
          </p>
        )}
      </div>
    );
  if (answer.type === "noul")
    return (
      <div className="space-y-8">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Yes probability</p>
          <p className="text-5xl font-medium tracking-tight tabular-nums">
            {percent(answer.noul)}
          </p>
        </div>
        <ProbabilityRow label="Yes" value={answer.noul} selected />
      </div>
    );
  const probabilities = answer.probabilities;
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          {answer.type === "choice" ? "Selected option" : "Expected score"}
        </p>
        <p className="wrap-break-word text-3xl font-medium tracking-tight tabular-nums">
          {answer.type === "choice" ? answer.choice : answer.score.toFixed(2)}
          {answer.type === "score" && question.type === "score" && (
            <span className="text-base text-muted-foreground">
              {" "}
              / {question.criteria.length - 1}
            </span>
          )}
        </p>
      </div>
      {probabilities && (
        <div className="space-y-5">
          {Object.entries(probabilities).map(([key, value]) => (
            <ProbabilityRow
              key={key}
              label={
                question.type === "score"
                  ? `${key} · ${question.criteria[Number(key)]}`
                  : key
              }
              value={value}
              selected={answer.type === "choice" && answer.choice === key}
            />
          ))}
        </div>
      )}
      {answer.confidence !== undefined && (
        <p className="text-xs text-muted-foreground">
          Confidence {percent(answer.confidence)}
        </p>
      )}
    </div>
  );
}
