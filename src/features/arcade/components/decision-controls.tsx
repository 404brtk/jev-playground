import { Button } from "@/components/ui/button";
import { RunButton } from "@/components/run-button";

export function DecisionControls({
  configured,
  pending,
  label,
  onRun,
  onCancel,
}: {
  configured: boolean;
  pending: boolean;
  label: string;
  onRun: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      {pending ? (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      ) : (
        <RunButton type="button" disabled={!configured} onClick={onRun}>
          {label}
        </RunButton>
      )}
      {!configured && (
        <p className="text-xs text-muted-foreground">
          Set <code>OPENROUTER_API_KEY</code> in <code>.env.local</code> to
          play.
        </p>
      )}
    </div>
  );
}
