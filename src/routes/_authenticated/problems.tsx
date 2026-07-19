import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { INTERVALS, todayISO } from "@/lib/spaced-repetition";
import { ExternalLink, Trash2, Plus, Pencil, Download } from "lucide-react";
import { toast } from "sonner";

import { useState, useMemo } from "react";
import { TOPICS } from "@/lib/topics";
import { ALL_PATTERNS } from "@/lib/patterns";

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
  pattern: string | null;
  url: string | null;
  notes: string | null;
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

  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");

  const uniqueTopics = useMemo(() => {
    const set = new Set<string>(TOPICS);
    problems.forEach((p) => {
      if (p.topic) set.add(p.topic);
    });
    return Array.from(set).sort();
  }, [problems]);

  const uniquePatterns = useMemo(() => {
    const set = new Set<string>(ALL_PATTERNS);
    problems.forEach((p) => {
      if (p.pattern) set.add(p.pattern);
    });
    return Array.from(set).sort();
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.topic.toLowerCase().includes(search.toLowerCase()) ||
        (p.pattern && p.pattern.toLowerCase().includes(search.toLowerCase()));

      const matchesTopic = !selectedTopic || p.topic.toLowerCase() === selectedTopic.toLowerCase();

      const matchesPattern =
        !selectedPattern ||
        (p.pattern && p.pattern.toLowerCase() === selectedPattern.toLowerCase());

      return matchesSearch && matchesTopic && matchesPattern;
    });
  }, [problems, search, selectedTopic, selectedPattern]);

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

  const handleExportCSV = () => {
    if (problems.length === 0) {
      toast.error("No problems to export.");
      return;
    }

    const escapeCSVField = (val: string | null | undefined): string => {
      if (val === null || val === undefined) return "";
      let str = String(val);
      const hasSpecialChar = /["\n\r,]/.test(str);
      if (hasSpecialChar) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      return str;
    };

    // Sort by solved_date descending
    const sorted = [...problems].sort((a, b) => b.solved_date.localeCompare(a.solved_date));

    // Canonical schema headers
    const headers = [
      "Title",
      "Platform",
      "Difficulty",
      "Topic",
      "Pattern",
      "URL",
      "Notes",
      "Date Solved",
    ];

    const rows = sorted.map((p) => [
      p.title,
      p.platform,
      p.difficulty,
      p.topic,
      p.pattern ?? "",
      p.url ?? "",
      p.notes ?? "",
      p.solved_date,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSVField).join(",")),
    ].join("\n");

    // Add UTF-8 BOM to preserve emojis & unicode chars, and trigger file download
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const localDateStr = `${year}-${month}-${day}`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `algorecall-export-${localDateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All problems</h1>
          <p className="text-sm text-muted-foreground">
            {problems.length} total — sorted by next review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link
            to="/add"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add problem
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      {!isLoading && problems.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by title, topic, or pattern..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All Topics</option>
            {uniqueTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All Patterns</option>
            {uniquePatterns.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>
      )}

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
                <th className="px-4 py-2.5 font-medium">Topic / Pattern</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Next review</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                    No problems match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
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
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{p.topic}</div>
                        {p.pattern && (
                          <div className="text-xs text-muted-foreground mt-0.5">{p.pattern}</div>
                        )}
                      </td>
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
                })
              )}
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
