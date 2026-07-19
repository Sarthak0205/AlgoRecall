import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { todayISO } from "@/lib/spaced-repetition";
import { TopicSelect } from "@/components/topic-select";
import { PatternSelect } from "@/components/pattern-select";
import {
  problemSchema,
  PLATFORMS,
  DIFFICULTIES,
  TITLE_MAX,
  TOPIC_MAX,
  NOTES_MAX,
  URL_MAX,
} from "@/lib/problem-schema";
import { createProblem } from "@/lib/problems.functions";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({ meta: [{ title: "Add problem — AlgoRecall" }] }),
  component: AddProblem,
});

function AddProblem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(createProblem);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    platform: "LeetCode",
    difficulty: "Medium" as (typeof DIFFICULTIES)[number],
    topic: "",
    pattern: "",
    url: "",
    notes: "",
    solved_date: todayISO(),
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const { [k]: _omit, ...rest } = e;
      return rest;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = problemSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await submit({ data: parsed.data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["problems"] }),
        queryClient.invalidateQueries({ queryKey: ["due-problems"] }),
      ]);
      toast.success("Problem added. First review in 1 day.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add problem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Add a solved problem</h1>
      <p className="text-sm text-muted-foreground">
        Log it now — AlgoRecall will resurface it on Day 1, 3, 7, 14, 30, 60.
      </p>

      <form onSubmit={onSubmit} noValidate className="surface-card mt-6 space-y-4 p-6">
        <Field
          label="Problem title"
          required
          error={errors.title}
          counter={`${[...form.title].length}/${TITLE_MAX}`}
        >
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value.slice(0, TITLE_MAX + 50))}
            placeholder="Two Sum"
            className={inputCls}
            aria-invalid={!!errors.title}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform" error={errors.platform}>
            <select
              value={form.platform}
              onChange={(e) => update("platform", e.target.value)}
              className={inputCls}
            >
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty" error={errors.difficulty}>
            <select
              value={form.difficulty}
              onChange={(e) =>
                update("difficulty", e.target.value as (typeof DIFFICULTIES)[number])
              }
              className={inputCls}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Topic" error={errors.topic}>
            <TopicSelect
              value={form.topic}
              onChange={(val) => update("topic", val)}
              error={errors.topic}
            />
          </Field>
          <Field label="Pattern (optional)" error={errors.pattern}>
            <PatternSelect
              value={form.pattern}
              onChange={(val) => update("pattern", val)}
              selectedTopic={form.topic}
              error={errors.pattern}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date solved" error={errors.solved_date}>
            <input
              type="date"
              value={form.solved_date}
              onChange={(e) => update("solved_date", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Problem URL" error={errors.url} counter={`${form.url.length}/${URL_MAX}`}>
          <input
            type="url"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://leetcode.com/problems/two-sum"
            className={inputCls}
            aria-invalid={!!errors.url}
          />
        </Field>

        <Field
          label="Notes & key insight"
          error={errors.notes}
          counter={`${[...form.notes].length}/${NOTES_MAX}`}
        >
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Hash map for O(n). Watch for duplicate values..."
            rows={5}
            className={`${inputCls} resize-y font-mono text-[13px]`}
            aria-invalid={!!errors.notes}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save problem"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive";

function Field({
  label,
  required,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        {counter && <span className="tabular-nums">{counter}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
