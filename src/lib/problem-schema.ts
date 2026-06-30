import { z } from "zod";

export const PLATFORMS = [
  "LeetCode",
  "Codeforces",
  "GeeksforGeeks",
  "HackerRank",
  "AtCoder",
  "Other",
] as const;

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export const TITLE_MAX = 200;
export const TOPIC_MAX = 80;
export const NOTES_MAX = 10000;
export const URL_MAX = 2000;
export const PLATFORM_MAX = 50;

// ISO date YYYY-MM-DD
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date." });

export const problemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Title is required." })
    .max(TITLE_MAX, { message: `Title must be less than ${TITLE_MAX} characters.` }),
  platform: z
    .string()
    .trim()
    .min(1, { message: "Platform is required." })
    .max(PLATFORM_MAX, { message: `Platform must be less than ${PLATFORM_MAX} characters.` }),
  difficulty: z.enum(DIFFICULTIES, {
    errorMap: () => ({ message: "Difficulty must be Easy, Medium, or Hard." }),
  }),
  topic: z
    .string()
    .trim()
    .max(TOPIC_MAX, { message: `Topic must be less than ${TOPIC_MAX} characters.` })
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .trim()
    .max(URL_MAX, { message: `URL must be less than ${URL_MAX} characters.` })
    .url({ message: "Please enter a valid URL." })
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(NOTES_MAX, { message: `Notes must be less than ${NOTES_MAX} characters.` })
    .optional()
    .or(z.literal("")),
  solved_date: isoDate,
});

export type ProblemInput = z.infer<typeof problemSchema>;
