import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  INTERVALS,
  daysFromNow,
  nextIntervalIndex,
  todayISO,
} from "@/lib/spaced-repetition";
import { useState } from "react";
import { Check, Eye, EyeOff, RotateCcw, ExternalLink, PartyPopper, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/revise")({
  head: () => ({ meta: [{ title: "Revise — AlgoRecall" }] }),
  component: Revise,
});

type Problem = {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  url: string | null;
  notes: string | null;
  interval_index: number;
  next_review_date: string;
  solved_date: string;
};

function Revise() {
  const queryClient = useQueryClient();
  const today = todayISO();

  const { data: due = [], isLoading } = useQuery({
    queryKey: ["due-problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Problem[];
    },
  });

  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const current = due[index];

  const review = useMutation({
    mutationFn: async ({ remembered }: { remembered: boolean }) => {
      if (!current) return;
      const newIndex = remembered ? nextIntervalIndex(current.interval_index) : 0;
      const days = INTERVALS[newIndex];
      const { error } = await supabase
        .from("problems")
        .update({
          interval_index: newIndex,
          next_review_date: daysFromNow(days),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq("id", current.id);
      if (error) throw error;
      return { remembered, days };
    },
    onSuccess: (res) => {
      if (res) {
        toast.success(
          res.remembered
            ? `Nice — next review in ${res.days} day${res.days > 1 ? "s" : ""}.`
            : "Reset to Day 1. You'll see it again tomorrow.",
        );
      }
      setShowNotes(false);
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["due-problems"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to update"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="surface-card p-10">
          <PartyPopper className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">All caught up</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No problems due right now. Check back tomorrow — or add a new one.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent"
            >
              Dashboard
            </Link>
            <Link
              to="/add"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Add problem
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remaining = due.length - index;
  const nextDays = INTERVALS[nextIntervalIndex(current.interval_index)];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revise</h1>
          <p className="text-sm text-muted-foreground">
            {remaining} problem{remaining > 1 ? "s" : ""} due. Recall before peeking.
          </p>
        </div>
        <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
          Step: Day {INTERVALS[current.interval_index]}
        </span>
      </div>

      <div className="surface-card mt-6 p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <DiffBadge d={current.difficulty} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {current.platform}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {current.topic}
          </span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{current.title}</h2>
          <Link
            to="/edit/$id"
            params={{ id: current.id }}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Edit problem"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </div>
        {current.url && (
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open problem <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your notes
            </span>
            <button
              onClick={() => setShowNotes((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent"
            >
              {showNotes ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Reveal
                </>
              )}
            </button>
          </div>
          <div className="mt-2 rounded-md border border-border bg-background/40 p-4">
            {showNotes ? (
              <pre className="whitespace-pre-wrap font-mono text-[13px] text-foreground">
                {current.notes || "No notes saved for this problem."}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Try to recall the approach and key insight first. Then reveal.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => review.mutate({ remembered: false })}
            disabled={review.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" /> Forgot — reset to Day 1
          </button>
          <button
            onClick={() => review.mutate({ remembered: true })}
            disabled={review.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Remembered — next in {nextDays}d
          </button>
        </div>
      </div>
    </div>
  );
}

function DiffBadge({ d }: { d: string }) {
  const cls =
    d === "Easy"
      ? "bg-success/15 text-success"
      : d === "Medium"
        ? "bg-warning/15 text-warning"
        : "bg-destructive/15 text-destructive";
  return <span className={`rounded-full px-2 py-0.5 font-medium ${cls}`}>{d}</span>;
}
