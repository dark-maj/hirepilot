import { z } from "zod";

export const analysisInputSchema = z
  .object({
    resumeText: z.string().min(1).max(15000),
    jobText: z.string().min(1).max(15000),
  })
  .strict()
  .refine(
    ({ resumeText, jobText }) => resumeText.trim().length > 0 && jobText.trim().length > 0,
    { message: "resumeText and jobText must not be empty." },
  );

export const analysisResultSchema = z
  .object({
    score: z.number().min(0).max(100),
    matched: z.array(
      z
        .object({
          skill: z.string().min(1),
          evidence: z.string().min(1).refine((evidence) => evidence.trim().length > 0),
        })
        .strict(),
    ),
    missing: z.array(
      z
        .object({
          skill: z.string().min(1),
          importance: z.enum(["high", "medium", "low"]),
        })
        .strict(),
    ),
    suggested: z.array(z.string()),
  })
  .strict();
