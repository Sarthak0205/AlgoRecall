import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { INTERVALS, todayISO } from "@/lib/spaced-repetition";
import { ExternalLink, Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/problems")({
  head: () => ({ meta: [{ title: "Problems — AlgoRecall" }] }),
  component: Problems,
});

type Problem = {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  url: string | null;
  interval_index: number;
  next_review_date: string;
  solved_date: string;
};

function Problems() {
  const queryClient = useQueryClient();
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("next_review_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Problem[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("problems").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Problem deleted");
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["due-problems"] });
    },
  });

  const today = todayISO();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All problems</h1>
          <p className="text-sm text-muted-foreground">
            {problems.length} total — sorted by next review.
          </p>
        </div>
        <Link
          to="/add"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add problem
        </Link>
      </div>

      <div className="surface-card mt-6 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : problems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No problems yet. Add your first solved problem.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Next review</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => {
                const overdue = p.next_review_date <= today;
                return (
                  <tr key={p.id} className="border-t border-border/60 hover:bg-accent/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.title}</span>
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
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DiffBadge d={p.difficulty} />
                        <span>{p.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.topic}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      Day {INTERVALS[p.interval_index]}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={overdue ? "text-warning" : "text-muted-foreground"}>
                        {p.next_review_date}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to="/edit/$id"
                          params={{ id: p.id }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id);
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DiffBadge({ d }: { d: string }) {
  const cls = d === "Easy" ? "text-success" : d === "Medium" ? "text-warning" : "text-destructive";
  return <span className={`font-medium ${cls}`}>{d}</span>;
}
