import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-md border border-primary/40 bg-primary/10">
            <span className="font-mono text-xs font-bold text-primary">AG</span>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-primary/70" />
          </span>
          <span className="text-base font-semibold tracking-tight">AgentGuard</span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[11px] tracking-[0.12em] uppercase">
          <Link
            to="/policies"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Policies
          </Link>
          <Link
            to="/console"
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open live console
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[11px] text-muted-foreground">
        <span>AgentGuard · runtime security &amp; action gateway for autonomous agents</span>
        <span>POST /api/public/intercept</span>
      </div>
    </footer>
  );
}
