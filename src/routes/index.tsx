import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Calendar, Flame, Sparkles, ArrowRight, Code2 } from "lucide-react";
import { redirectIfAuthenticated } from "@/lib/auth-redirect";

export const Route = createFileRoute("/")({
  beforeLoad: redirectIfAuthenticated,
  head: () => ({
    meta: [
      { title: "AlgoRecall — Never forget a solved problem again" },
      {
        name: "description",
        content:
          "Spaced repetition for solved LeetCode, Codeforces, and DSA problems. Day 1, 3, 7, 14, 30, 60.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Brain className="h-4 w-4" />
          </span>
          AlgoRecall
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/auth"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Spaced repetition for programmers
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-6xl">
            Never forget a{" "}
            <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.13_200)] bg-clip-text text-transparent">
              solved problem
            </span>{" "}
            again.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Log every LeetCode and DSA problem you crack. AlgoRecall surfaces it again on Day 1, 3,
            7, 14, 30, and 60 — so the pattern is yours for good.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90"
            >
              Start tracking — it's free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Calendar,
              title: "Smart intervals",
              body: "Day 1, 3, 7, 14, 30, 60. Remember it → advance. Forget → reset to Day 1.",
            },
            {
              icon: Flame,
              title: "Streaks that stick",
              body: "Daily reviews build a streak. Skip a day, lose momentum. Simple.",
            },
            {
              icon: Code2,
              title: "Made for DSA",
              body: "LeetCode, Codeforces, GFG. Tag by topic. Keep notes for the key insight.",
            },
          ].map((f) => (
            <div key={f.title} className="surface-card p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
