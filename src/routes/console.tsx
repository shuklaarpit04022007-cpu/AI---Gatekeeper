import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { VerdictBadge } from "@/components/verdict-badge";
import { Button } from "@/components/ui/button";
import { randomCall, HOSTILE_CALLS, type SimulatedCall } from "@/lib/agent-simulator";
import type { Decision } from "@/lib/policy";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "AgentGuard — AI Agent Runtime Security Gateway" },
      {
        name: "description",
        content:
          "AgentGuard intercepts autonomous AI agent tool calls in real time, classifies them Green, Amber or Red, and holds destructive actions for human approval.",
      },
      { property: "og:title", content: "AgentGuard — AI Agent Runtime Security Gateway" },
      {
        property: "og:description",
        content:
          "Live interception, policy scoring and human-in-the-loop approval for autonomous AI agent tool calls.",
      },
    ],
  }),
  component: Dashboard,
});

type Record_ = Decision & { resolution?: "approved" | "denied"; resolvedAt?: string };

const SAMPLE_PAYLOAD = JSON.stringify(
  {
    agent: "db-maintenance-agent",
    tool: "drop_database_table",
    arguments: { table: "customers", cascade: true },
    reasoning: "Cleaning up stale tables before the migration.",
  },
  null,
  2,
);

function Dashboard() {
  const [records, setRecords] = useState<Record_[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async (body: unknown) => {
    const res = await fetch("/api/public/intercept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Interceptor rejected the payload");
    setRecords((prev) => [json as Record_, ...prev].slice(0, 60));
    return json as Decision;
  }, []);

  const dispatch = useCallback(
    async (call: SimulatedCall) => {
      setError(null);
      setBusy(true);
      try {
        await send(call);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setBusy(false);
      }
    },
    [send],
  );

  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => {
      void dispatch(randomCall(0.22));
    }, 2200);
    return () => clearInterval(id);
  }, [streaming, dispatch]);

  const submitCustom = async () => {
    setError(null);
    setBusy(true);
    try {
      JSON.parse(payload);
      await send(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    } finally {
      setBusy(false);
    }
  };

  const resolve = (id: string, resolution: "approved" | "denied") =>
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, resolution, resolvedAt: new Date().toISOString() } : r,
      ),
    );

  const pending = records.filter((r) => r.verdict === "red" && !r.resolution);
  const stats = useMemo(() => {
    const total = records.length || 1;
    const avg = records.reduce((a, r) => a + r.latencyMs, 0) / total;
    return {
      total: records.length,
      green: records.filter((r) => r.verdict === "green").length,
      amber: records.filter((r) => r.verdict === "amber").length,
      red: records.filter((r) => r.verdict === "red").length,
      injections: records.filter((r) => r.injectionFlags.length > 0).length,
      avgLatency: records.length ? avg.toFixed(2) : "0.00",
    };
  }, [records]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="gridwash">
        <header className="border-b border-border/70 bg-surface/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative grid size-10 place-items-center overflow-hidden rounded-md border border-primary/40 bg-primary/10">
                <span className="font-mono text-sm font-bold text-primary">AG</span>
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-primary/70" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">AgentGuard</h1>
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  Autonomous agent runtime security &amp; action gateway
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                <span
                  className={
                    streaming
                      ? "size-2 animate-pulse rounded-full bg-green-signal"
                      : "size-2 rounded-full bg-muted-foreground"
                  }
                />
                {streaming ? "GATEWAY LIVE" : "GATEWAY IDLE"}
              </span>
              <Button
                variant={streaming ? "secondary" : "default"}
                onClick={() => setStreaming((s) => !s)}
              >
                {streaming ? "Pause agent traffic" : "Start agent traffic"}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { label: "Calls inspected", value: stats.total, tone: "text-foreground" },
              { label: "Green passed", value: stats.green, tone: "text-green-signal" },
              { label: "Amber logged", value: stats.amber, tone: "text-amber-signal" },
              { label: "Red blocked", value: stats.red, tone: "text-red-signal" },
              { label: "Injection hits", value: stats.injections, tone: "text-red-signal" },
              {
                label: "Avg decision (ms)",
                value: stats.avgLatency,
                tone: "text-primary",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-card/80 p-4 shadow-panel"
              >
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className={`mt-2 font-mono text-2xl font-semibold ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col gap-4">
              <div
                className={
                  pending.length
                    ? "animate-pulse-alert rounded-lg border border-red-signal/50 bg-card p-5"
                    : "rounded-lg border border-border bg-card/80 p-5 shadow-panel"
                }
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Human-in-the-loop approvals
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {pending.length} awaiting decision
                  </span>
                </div>

                {pending.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No destructive actions are being held. Red-classified calls are blocked at the
                    gateway and appear here for manual authorization.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {pending.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-md border border-red-signal/40 bg-red-signal/5 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-sm font-semibold text-red-signal">
                            {r.call.tool}()
                          </p>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            risk {r.riskScore}/99 · {r.call.agent}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {r.reasons.map((reason) => (
                            <li key={reason}>— {reason}</li>
                          ))}
                        </ul>
                        <pre className="mt-3 overflow-x-auto rounded bg-background/70 p-3 font-mono text-[11px] text-foreground/80">
                          {JSON.stringify(r.call.arguments, null, 2)}
                        </pre>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => resolve(r.id, "approved")}>
                            Approve once
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => resolve(r.id, "denied")}
                          >
                            Deny &amp; kill call
                          </Button>
                          <span className="ml-auto self-center font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                            rules: {r.matchedRules.join(" · ")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card/80 p-5 shadow-panel">
                <h2 className="text-sm font-semibold tracking-tight">Send a live tool-call JSON</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Posted to the gateway, parsed and validated against the schema, then scored by the
                  policy engine.
                </p>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  spellCheck={false}
                  rows={10}
                  className="mt-3 w-full resize-y rounded-md border border-input bg-background/70 p-3 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/60"
                />
                {error && (
                  <p className="mt-2 font-mono text-xs text-red-signal">Gateway error: {error}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={submitCustom} disabled={busy}>
                    Intercept payload
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      dispatch({
                        agent: "analytics-agent",
                        tool: "get_customer_profile",
                        arguments: { customer_id: "cus_10482" },
                      })
                    }
                  >
                    Benign read
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => dispatch(HOSTILE_CALLS[0]!)}
                  >
                    drop_database_table
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => dispatch(HOSTILE_CALLS[2]!)}
                  >
                    Prompt injection
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/80 shadow-panel">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight">Interception feed</h2>
                <button
                  onClick={() => setRecords([])}
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              </div>
              <div ref={feedRef} className="max-h-[38rem] divide-y divide-border overflow-y-auto">
                {records.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No traffic yet. Start agent traffic or post a payload.
                  </p>
                )}
                {records.map((r) => (
                  <article key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-sm">{r.call.tool}()</p>
                      <VerdictBadge verdict={r.verdict} />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {r.call.agent} · {new Date(r.receivedAt).toLocaleTimeString()} ·{" "}
                      {r.latencyMs}ms · risk {r.riskScore}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{r.reasons[0]}</p>
                    {r.injectionFlags.length > 0 && (
                      <p className="mt-1 font-mono text-[11px] text-red-signal">
                        injection: {r.injectionFlags.join(", ")}
                      </p>
                    )}
                    {r.resolution && (
                      <p
                        className={
                          r.resolution === "approved"
                            ? "mt-2 font-mono text-[11px] text-amber-signal"
                            : "mt-2 font-mono text-[11px] text-red-signal"
                        }
                      >
                        human {r.resolution} at{" "}
                        {r.resolvedAt && new Date(r.resolvedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t border-border pt-5 font-mono text-[11px] text-muted-foreground">
            Policy engine: schema validation → destructive-class match → injection regex sweep →
            argument blast-radius hints. Red actions never execute without an explicit human
            decision.
          </footer>
        </main>
      </div>
    </div>
  );
}
