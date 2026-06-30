import { z } from "zod";
import { problemSchema, DIFFICULTIES } from "./problem-schema";

export type RawCsvRow = Record<string, string | undefined>;

export type ParsedRow = {
  rowNumber: number; // 1-based index of data rows (excluding header)
  raw: RawCsvRow;
  data?: z.infer<typeof problemSchema>;
  errors: string[];
};

// Column header aliases (case/space-insensitive)
const HEADER_MAP: Record<string, keyof ReturnType<typeof emptyMap>> = {
  "problem name": "title",
  title: "title",
  topic: "topic",
  difficulty: "difficulty",
  platform: "platform",
  "date solved": "solved_date",
  "solved date": "solved_date",
  link: "url",
  url: "url",
  notes: "notes",
};

function emptyMap() {
  return {
    title: "",
    topic: "",
    difficulty: "",
    platform: "",
    solved_date: "",
    url: "",
    notes: "",
  };
}

function normKey(k: string): string {
  return k.replace(/^\uFEFF/, "").trim().toLowerCase();
}

// Parse a date string like "May 9, 2026", "2026-05-09", "9 May 2026"
export function parseFlexibleDate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ALLOWED_DIFFICULTY = new Set<string>(DIFFICULTIES);

function normalizeDifficulty(input: string): string {
  const s = input.trim();
  if (!s) return "";
  const cap = s[0].toUpperCase() + s.slice(1).toLowerCase();
  return cap;
}

export function mapAndValidate(raw: RawCsvRow, rowNumber: number): ParsedRow {
  const mapped = emptyMap();
  for (const [rawKey, value] of Object.entries(raw)) {
    const key = HEADER_MAP[normKey(rawKey)];
    if (!key) continue;
    mapped[key] = (value ?? "").toString();
  }

  const errors: string[] = [];

  const title = mapped.title.trim();
  const topic = mapped.topic.trim() || "General";
  const platform = mapped.platform.trim() || "Other";
  const url = mapped.url.trim();
  const notes = mapped.notes; // preserve newlines & whitespace
  const difficulty = normalizeDifficulty(mapped.difficulty);

  if (!title) errors.push("Missing Problem Name");
  if (!ALLOWED_DIFFICULTY.has(difficulty))
    errors.push(`Invalid Difficulty "${mapped.difficulty}". Must be Easy, Medium, or Hard.`);

  let solved_date = parseFlexibleDate(mapped.solved_date);
  if (!solved_date) {
    if (mapped.solved_date.trim()) {
      errors.push(`Invalid Date Solved "${mapped.solved_date}".`);
    } else {
      errors.push("Missing Date Solved");
    }
    solved_date = "1970-01-01";
  }

  const candidate = {
    title,
    topic,
    platform,
    difficulty: difficulty as (typeof DIFFICULTIES)[number],
    url: url || "",
    notes,
    solved_date,
  };

  const parsed = problemSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] ?? "field";
      errors.push(`${String(field)}: ${issue.message}`);
    }
  }

  return {
    rowNumber,
    raw,
    data: parsed.success && errors.length === 0 ? parsed.data : undefined,
    errors,
  };
}
