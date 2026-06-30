import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { problemSchema } from "./problem-schema";
import { daysFromNow, todayISO } from "./spaced-repetition";

export const createProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => problemSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: inserted } = await supabase
      .from("problems")
      .insert({
        user_id: userId,
        title: data.title,
        platform: data.platform,
        difficulty: data.difficulty,
        topic: data.topic?.trim() || "General",
        url: data.url?.trim() || null,
        notes: data.notes?.trim() || null,
        solved_date: data.solved_date,
        interval_index: 0,
        next_review_date: daysFromNow(1),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

const updateSchema = problemSchema.extend({ id: z.string().uuid() });

export const updateProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...fields } = data;
    const { error, data: updated } = await supabase
      .from("problems")
      .update({
        title: fields.title,
        platform: fields.platform,
        difficulty: fields.difficulty,
        topic: fields.topic?.trim() || "General",
        url: fields.url?.trim() || null,
        notes: fields.notes?.trim() || null,
        solved_date: fields.solved_date,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

const bulkSchema = z.object({
  rows: z.array(problemSchema).min(1).max(1000),
});

export const bulkCreateProblems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = todayISO();
    const payload = data.rows.map((d) => ({
      user_id: userId,
      title: d.title,
      platform: d.platform,
      difficulty: d.difficulty,
      topic: d.topic?.trim() || "General",
      url: d.url?.trim() || null,
      notes: d.notes ?? null,
      solved_date: d.solved_date,
      interval_index: 0,
      next_review_date: today,
    }));
    const { error, data: inserted } = await supabase
      .from("problems")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0 };
  });
