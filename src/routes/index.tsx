import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentGuard — Runtime Security & Action Gateway for AI Agents" },
      {
        name: "description",
        content:
          "AgentGuard is a firewall for autonomous AI agents: it intercepts every tool call, classifies it Green, Amber or Red, and blocks destructive actions until a human approves.",
      },
      { property: "og:title", content: "AgentGuard — Runtime Security & Action Gateway" },
      {
        property: "og:description",
        content:
          "Intercept agent tool calls, score their risk in milliseconds, and hold destructive operations for human approval.",
      },
    ],
  }),
  component: Landing,
});

const FLOW = [
  {
    step: "01",
    title: "Intercept",
    body: "Every tool-call JSON payload the agent emits is posted to the gateway before it executes, and validated against a strict schema.",
  },
  {
    step: "02",
    title: "Classify",
    body: "The policy engine matches destructive operation classes, sweeps arguments for prompt-injection signatures, and scores blast radius.",
  },
  {
    step: "03",
    title: "Gate",
    body: "Green passes instantly, Amber is allowed and logged, Red is blocked and queued for a human decision in the live console.",
  },
];

const THREATS = [
  {
    title: "Rogue database operations",
    body: "A reasoning loop decides stale tables should go and calls drop_database_table with cascade. The gateway stops it before a single row is lost.",
  },
  {
    title: "Credential exfiltration",
    body: "A support ticket tells the agent to fetch the Stripe key and paste it in the reply. Secret-reading tools are Red by class, not by luck.",
  },
  {
    title: "Prompt injection in arguments",
    body: "Injected text hides inside an otherwise normal update call. Regex signatures escalate it to Red even though the tool name looks benign.",
  },
  {
    title: "Silent safety tampering",
    body: "Disabling backups, wiping audit logs or turning off MFA are treated as attacks on the guardrails themselves and always need a human.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteNav />
      <main>
        <section className="gridwash border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
                Agentic AI · Runtime security
              </p>
              <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
                A firewall for autonomous AI agents.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Agents with tool-calling power can delete a production table or leak a credential in
                one confident step. AgentGuard sits between the agent and its tools, scores every
                action in milliseconds, and refuses to let a destructive one through without a human
                saying yes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/console"
                  className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open the live console
                </Link>
                <Link
                  to="/policies"
                  className="rounded-md border border-input px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Read the rulebook
                </Link>
              </div>
              <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
                {[
                  ["~2 ms", "decision latency"],
                  ["3 tiers", "green · amber · red"],
                  ["8 classes", "destructive operations"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-lg border border-border bg-card/70 p-4">
                    <dt className="font-mono text-xl font-semibold text-primary">{v}</dt>
                    <dd className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                      {l}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">How the gateway works</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {FLOW.map((f) => (
                <article
                  key={f.step}
                  className="rounded-lg border border-border bg-card/80 p-6 shadow-panel"
                >
                  <p className="font-mono text-xs text-primary">{f.step}</p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">What it stops</h2>
              <p className="mt-3 text-muted-foreground">
                Guardrails at the prompt level are advisory. AgentGuard enforces at the action
                layer, where the damage actually happens.
              </p>
              <div className="mt-6 space-y-4">
                {THREATS.map((t) => (
                  <div key={t.title} className="rounded-lg border border-border bg-card/70 p-5">
                    <h3 className="text-sm font-semibold">{t.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/80 p-6 shadow-panel">
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Example verdict
              </p>
              <pre className="mt-4 overflow-x-auto rounded-md bg-background/70 p-4 font-mono text-xs text-foreground/85">
                {`{
  "tool": "drop_database_table",
  "verdict": "red",
  "action": "blocked_pending_approval",
  "riskScore": 99,
  "matchedRules": [
    "RED-01 destructive schema drop"
  ],
  "reasons": [
    "Tool matches an irreversible operation class.",
    "Argument hint: cascading effect."
  ],
  "latencyMs": 1.63
}`}
              </pre>
              <p className="mt-4 text-sm text-muted-foreground">
                The same call sent through the console appears as a pulsing alert that waits for
                Approve or Deny — nothing executes in between.
              </p>
              <Link
                to="/console"
                className="mt-5 inline-flex rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Try it live
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
