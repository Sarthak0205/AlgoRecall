import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/spaced-repetition";
import {
  CheckCircle2,
  CalendarClock,
  Flame,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AlgoRecall" }] }),
  component: Dashboard,
});

type Problem = {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  url: string | null;
  notes: string | null;
  solved_date: string;
  interval_index: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  created_at: string;
};

function Dashboard() {
  const { data: problems, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Problem[];
    },
  });

  const today = todayISO();
  const total = problems?.length ?? 0;
  const due = problems?.filter((p) => p.next_review_date <= today).length ?? 0;
  const streak = computeStreak(problems ?? []);

  const byTopic = new Map<string, number>();
  problems?.forEach((p) => byTopic.set(p.topic, (byTopic.get(p.topic) ?? 0) + 1));
  const topics = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = topics[0]?.[1] ?? 1;
  const recent = problems?.slice(0, 6) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your spaced-repetition memory bank.</p>
        </div>
        <Link
          to="/add"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add problem <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CheckCircle2} label="Total solved" value={isLoading ? "—" : total} />
        <Stat
          icon={CalendarClock}
          label="Due today"
          value={isLoading ? "—" : due}
          tint="warning"
          cta={due > 0 ? { to: "/revise", label: "Revise now" } : undefined}
        />
        <Stat
          icon={Flame}
          label="Current streak"
          value={isLoading ? "—" : `${streak}d`}
          tint="primary"
        />
        <Stat
          icon={TrendingUp}
          label="Mastered (Day 60)"
          value={isLoading ? "—" : (problems?.filter((p) => p.interval_index >= 5).length ?? 0)}
          tint="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="surface-card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold">Topics</h2>
          <p className="text-xs text-muted-foreground">Progress by topic.</p>
          <div className="mt-4 space-y-3">
            {topics.length === 0 && (
              <p className="text-sm text-muted-foreground">No problems yet.</p>
            )}
            {topics.map(([name, count]) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <p className="text-xs text-muted-foreground">Latest problems you logged.</p>
          <div className="mt-4 space-y-2">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
            {recent.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DiffBadge d={p.difficulty} />
                    <span>{p.platform}</span>
                    <span>·</span>
                    <span>{p.topic}</span>
                  </div>
                </div>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tint,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tint?: "primary" | "success" | "warning";
  cta?: { to: string; label: string };
}) {
  const tintCls =
    tint === "primary"
      ? "text-primary"
      : tint === "success"
        ? "text-success"
        : tint === "warning"
          ? "text-warning"
          : "text-muted-foreground";
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tintCls}`} />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {cta && (
        <Link
          to={cta.to}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function DiffBadge({ d }: { d: string }) {
  const cls = d === "Easy" ? "text-success" : d === "Medium" ? "text-warning" : "text-destructive";
  return <span className={`font-medium ${cls}`}>{d}</span>;
}

function computeStreak(problems: Problem[]): number {
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const dates = new Set<string>();
  for (const p of problems) {
    dates.add(p.solved_date);
    if (p.last_reviewed_at) dates.add(p.last_reviewed_at.slice(0, 10));
  }
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!dates.has(fmt(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (dates.has(fmt(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
