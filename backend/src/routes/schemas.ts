/** Zod schemas shared by validate() middleware for request body/query. */
import { z } from "zod";

export const verifyWorldIdSchema = z.object({
  payload: z.record(z.any()),
  action: z.string().min(1),
  signal: z.string().optional()
});

export const createHealthSchema = z.object({
  sodium: z.number().finite().nonnegative(),
  vitamin_d: z.number().finite().nonnegative(),
  calcium: z.number().finite().nonnegative(),
  magnesium: z.number().finite().nonnegative()
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional()
});

export const createExerciseSchema = z.object({
  type: z.string().min(1).max(50),
  duration_minutes: z.number().int().positive().max(1440),
  intensity: z.number().int().min(1).max(10)
});
