import type { Verdict } from "@/lib/policy";
import { cn } from "@/lib/utils";

const styles: Record<Verdict, string> = {
  green: "border-green-signal/40 bg-green-signal/15 text-green-signal",
  amber: "border-amber-signal/40 bg-amber-signal/15 text-amber-signal",
  red: "border-red-signal/50 bg-red-signal/20 text-red-signal",
};

const labels: Record<Verdict, string> = {
  green: "GREEN · APPROVED",
  amber: "AMBER · LOGGED",
  red: "RED · BLOCKED",
};

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em]",
        styles[verdict],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[verdict]}
    </span>
  );
}
