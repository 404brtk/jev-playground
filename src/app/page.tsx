import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DecisionPlayground } from "@/features/decisions/components/decision-playground";

async function ConnectedPlayground() {
  await connection();
  return (
    <DecisionPlayground
      configured={Boolean(process.env.OPENROUTER_API_KEY?.trim())}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="mx-auto w-full max-w-6xl space-y-8 p-8"
          role="status"
          aria-label="Loading playground"
        >
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-110 w-full" />
        </div>
      }
    >
      <ConnectedPlayground />
    </Suspense>
  );
}
