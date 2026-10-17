import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function RunButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "min-w-32 motion-safe:transition-[scale,background-color] motion-safe:enabled:active:scale-[0.96] forced-colors:border-[ButtonText]",
        className,
      )}
      {...props}
    />
  );
}
