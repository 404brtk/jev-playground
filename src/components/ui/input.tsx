import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "min-h-10 w-full rounded-lg border border-input bg-card p-2 text-base leading-[1.55] font-normal text-foreground shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
