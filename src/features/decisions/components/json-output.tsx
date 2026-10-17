import { useState } from "react";
import { Button } from "@/components/ui/button";

export function JsonOutput({ value }: { value: unknown }) {
  const [status, setStatus] = useState("");
  const json = JSON.stringify(value, null, 2);
  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setStatus("Copied");
    } catch {
      setStatus("Clipboard unavailable. Select the JSON to copy it.");
    }
  }
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
        <span role="status" className="text-xs text-muted-foreground">
          {status}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          Copy JSON
        </Button>
      </div>
      <pre
        tabIndex={0}
        aria-label="Decision response JSON"
        className="max-h-[70dvh] overflow-auto whitespace-pre-wrap break-all rounded-md font-mono text-xs leading-[1.7] focus-visible:outline-2 focus-visible:outline-ring"
      >
        {json}
      </pre>
    </div>
  );
}
