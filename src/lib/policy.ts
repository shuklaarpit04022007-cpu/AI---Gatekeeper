import { z } from "zod";

export type Verdict = "green" | "amber" | "red";

export const toolCallSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  agent: z.string().min(1).max(120).default("unknown-agent"),
  tool: z.string().min(1).max(120),
  arguments: z.record(z.string(), z.unknown()).default({}),
  reasoning: z.string().max(2000).optional(),
});

export type ToolCall = z.infer<typeof toolCallSchema>;

export interface Decision {
  id: string;
  receivedAt: string;
  verdict: Verdict;
  action: "approved" | "logged" | "blocked_pending_approval";
  reasons: string[];
  matchedRules: string[];
  injectionFlags: string[];
  riskScore: number;
  latencyMs: number;
  call: ToolCall;
}

/** Destructive / irreversible operations — always Red. */
const RED_TOOL_PATTERNS: Array<[RegExp, string]> = [
  [/drop_(database|table|schema|collection)/i, "RED-01 destructive schema drop"],
  [/delete_(all|users|records|bucket|project)/i, "RED-02 bulk delete"],
  [/truncate/i, "RED-03 table truncation"],
  [/(rotate|exfiltrate|read|dump)_(secret|credential|api_key|token)s?/i, "RED-04 credential access"],
  [/(transfer|send)_(funds|payment|money|wire)/i, "RED-05 financial transfer"],
  [/(disable|delete)_(backup|audit_log|mfa)/i, "RED-06 tampering with safety controls"],
  [/(exec|run)_(shell|command)|sudo|chmod_777/i, "RED-07 arbitrary command execution"],
  [/deploy_to_production|force_push/i, "RED-08 unreviewed production change"],
];

/** State-changing but recoverable — Amber. */
const AMBER_TOOL_PATTERNS: Array<[RegExp, string]> = [
  [/^(update|patch|write|insert|create|upsert)_/i, "AMBER-01 write operation"],
  [/send_(email|message|slack|sms)/i, "AMBER-02 outbound communication"],
  [/(invite|add)_user|grant_/i, "AMBER-03 access change"],
  [/http_(post|put|delete)|call_external_api/i, "AMBER-04 external side effect"],
  [/refund|charge/i, "AMBER-05 billing operation"],
];

/** Known-safe read tools — Green fast path. */
const GREEN_TOOL_PATTERNS: Array<[RegExp, string]> = [
  [/^(get|read|list|search|fetch|describe|count|preview)_/i, "GREEN-01 read-only operation"],
  [/^http_get$/i, "GREEN-02 idempotent GET"],
];

/** Bonus: regex-based prompt-injection detection inside arguments. */
const INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [/ignore (all |any )?(previous|prior|above) instructions/i, "instruction override"],
  [/disregard (your )?(system prompt|guardrails|policy)/i, "guardrail bypass"],
  [/you are now (a |an )?(dev|admin|root|unrestricted)/i, "role escalation"],
  [/\bDAN\b|jailbreak|do anything now/i, "jailbreak phrasing"],
  [/(reveal|print|show) (me )?(your )?(system prompt|api[_ ]?key|secret|password)/i, "secret extraction"],
  [/base64|atob\(|eval\(|<script/i, "obfuscated payload"],
  [/;\s*(drop|delete|update)\s+\w+|--\s*$|'\s*or\s*'1'\s*=\s*'1/i, "SQL injection pattern"],
  [/\bwhere\s+1\s*=\s*1\b|\bdelete\b[^.]*\bwithout\b[^.]*\bwhere\b/i, "unbounded mutation"],
];

const DANGEROUS_ARG_HINTS: Array<[RegExp, string]> = [
  [/^\*$/, "wildcard scope"],
  [/cascade/i, "cascading effect"],
  [/force/i, "forced override"],
];

function flattenArgs(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (typeof value === "number" || typeof value === "boolean") out.push(String(value));
  else if (Array.isArray(value)) value.forEach((v) => flattenArgs(v, out));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([k, v]) => {
      out.push(k);
      flattenArgs(v, out);
    });
  return out;
}

export function evaluateToolCall(call: ToolCall): Omit<Decision, "latencyMs"> {
  const reasons: string[] = [];
  const matchedRules: string[] = [];
  const injectionFlags: string[] = [];
  let verdict: Verdict = "amber";
  let risk = 35;

  const haystack = [call.tool, ...flattenArgs(call.arguments), call.reasoning ?? ""].join(" \n ");

  for (const [re, rule] of RED_TOOL_PATTERNS) {
    if (re.test(call.tool)) {
      verdict = "red";
      risk = Math.max(risk, 92);
      matchedRules.push(rule);
      reasons.push(`Tool "${call.tool}" matches an irreversible operation class.`);
    }
  }

  if (verdict !== "red") {
    const amber = AMBER_TOOL_PATTERNS.find(([re]) => re.test(call.tool));
    const green = GREEN_TOOL_PATTERNS.find(([re]) => re.test(call.tool));
    if (amber) {
      verdict = "amber";
      risk = 48;
      matchedRules.push(amber[1]);
      reasons.push("Mutating call with a recoverable blast radius — logged and allowed.");
    } else if (green) {
      verdict = "green";
      risk = 8;
      matchedRules.push(green[1]);
      reasons.push("Read-only, side-effect-free call — passed through instantly.");
    } else {
      matchedRules.push("AMBER-99 unknown tool, default deny-to-log");
      reasons.push(`Tool "${call.tool}" is not in the allowlist; treated as unknown risk.`);
    }
  }

  for (const [re, label] of INJECTION_PATTERNS) {
    if (re.test(haystack)) {
      injectionFlags.push(label);
    }
  }
  if (injectionFlags.length > 0) {
    risk = Math.max(risk, 88);
    verdict = "red";
    matchedRules.push("RED-INJ prompt-injection signature in arguments");
    reasons.push(
      `Prompt-injection signature detected (${injectionFlags.join(", ")}). Escalated to human review.`,
    );
  }

  for (const [re, label] of DANGEROUS_ARG_HINTS) {
    if (flattenArgs(call.arguments).some((s) => re.test(s))) {
      risk = Math.min(99, risk + 12);
      reasons.push(`Argument hint: ${label}.`);
      if (verdict === "green") verdict = "amber";
    }
  }

  return {
    id: call.id ?? crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    verdict,
    action:
      verdict === "red" ? "blocked_pending_approval" : verdict === "amber" ? "logged" : "approved",
    reasons,
    matchedRules,
    injectionFlags,
    riskScore: Math.min(99, risk),
    call,
  };
}

export function intercept(payload: unknown): Decision {
  const start = performance.now();
  const call = toolCallSchema.parse(payload);
  const decision = evaluateToolCall(call);
  return { ...decision, latencyMs: Math.round((performance.now() - start) * 1000) / 1000 };
}
