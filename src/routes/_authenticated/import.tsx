import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { mapAndValidate, type ParsedRow, type RawCsvRow } from "@/lib/csv-import";
import { bulkCreateProblems } from "@/lib/problems.functions";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Import CSV — AlgoRecall" }] }),
  component: ImportPage,
});

function ImportPage() {
  const navigate = useNavigate();
  const submit = useServerFn(bulkCreateProblems);
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);

  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);

  function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h, // keep original; mapping handles normalization
      complete: (results) => {
        const parsed = results.data
          .filter((r) => r && Object.values(r).some((v) => (v ?? "").toString().trim() !== ""))
          .map((r, i) => mapAndValidate(r, i + 1));
        setRows(parsed);
        setParsing(false);
        if (parsed.length === 0) toast.error("No rows found in CSV.");
        else toast.success(`Parsed ${parsed.length} rows.`);
      },
      error: (err) => {
        setParsing(false);
        toast.error(`Parse error: ${err.message}`);
      },
    });
  }

  async function onImport() {
    if (valid.length === 0) return;
    setImporting(true);
    try {
      const res = await submit({ data: { rows: valid.map((r) => r.data!) } });
      toast.success(`Imported ${res.inserted} problems. First review today.`);
      navigate({ to: "/problems" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setRows([]);
    setFileName("");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Import from CSV</h1>
      <p className="text-sm text-muted-foreground">
        Upload a Notion (or compatible) CSV export. All imported problems start at Day 1 review today.
      </p>

      {rows.length === 0 ? (
        <label className="surface-card mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-12 text-center hover:bg-accent/30">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium">
            {parsing ? "Parsing..." : "Click to choose a CSV file"}
          </div>
          <div className="text-xs text-muted-foreground">
            Expected columns: Problem Name, Topic, Difficulty, Platform, Date Solved, Link, Notes
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      ) : (
        <>
          <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">— Found {rows.length} rows</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {valid.length} valid
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${
                  invalid.length
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <AlertTriangle className="h-4 w-4" /> {invalid.length} invalid
              </span>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
              <button
                onClick={onImport}
                disabled={importing || valid.length === 0}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {importing ? "Importing..." : `Import ${valid.length} problems`}
              </button>
            </div>
          </div>

          {invalid.length > 0 && (
            <div className="surface-card mt-4 p-4">
              <h2 className="mb-2 text-sm font-semibold text-amber-400">Invalid rows</h2>
              <ul className="space-y-2 text-xs">
                {invalid.map((r) => (
                  <li key={r.rowNumber} className="rounded-md border border-border bg-background p-2">
                    <div className="font-medium">
                      Row {r.rowNumber}: {r.raw["Problem Name"] || r.raw["Title"] || "(no title)"}
                    </div>
                    <ul className="ml-4 list-disc text-destructive">
                      {r.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="surface-card mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Difficulty</th>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Date Solved</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r) => {
                  const ok = r.errors.length === 0;
                  return (
                    <tr key={r.rowNumber} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">{r.rowNumber}</td>
                      <td className="px-3 py-2">
                        {ok ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <span className="text-amber-400">⚠</span>
                        )}
                      </td>
                      <td className="max-w-[280px] truncate px-3 py-2">
                        {r.data?.title || r.raw["Problem Name"] || r.raw["Title"] || ""}
                      </td>
                      <td className="px-3 py-2">{r.data?.topic || r.raw["Topic"] || "General"}</td>
                      <td className="px-3 py-2">{r.data?.difficulty || r.raw["Difficulty"] || ""}</td>
                      <td className="px-3 py-2">{r.data?.platform || r.raw["Platform"] || ""}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.data?.solved_date || r.raw["Date Solved"] || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
                Showing first 200 of {rows.length} rows
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
