import { z } from "zod";

export const ContentLocaleSchema = z.enum(["he"]);

export const LessonBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("prose"),
    id: z.string().min(1),
    markdown: z.string().min(1),
  }),
  z.object({
    type: z.literal("callout"),
    id: z.string().min(1),
    tone: z.enum(["info", "warning", "risk", "sim"]),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  z.object({
    type: z.literal("term"),
    id: z.string().min(1),
    termEn: z.string().min(1),
    termHe: z.string().min(1),
    definitionHe: z.string().min(1),
  }),
  z.object({
    type: z.literal("quiz_stub"),
    id: z.string().min(1),
    promptHe: z.string().min(1),
    choices: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().int().nonnegative(),
  }),
]);

export const LessonSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titleHe: z.string().min(1),
  summaryHe: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  simulationOnly: z.literal(true),
  blocks: z.array(LessonBlockSchema).default([]),
});

export const ModuleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titleHe: z.string().min(1),
  summaryHe: z.string().min(1),
  order: z.number().int().nonnegative(),
  lessons: z.array(LessonSchema).min(1),
});

export const CourseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titleHe: z.string().min(1),
  subtitleHe: z.string().min(1),
  locale: ContentLocaleSchema,
  simulationOnly: z.literal(true),
  modules: z.array(ModuleSchema).min(1),
});

export const AcademyCatalogSchema = z.object({
  version: z.string().min(1),
  product: z.literal("zigzag-trading-academy"),
  courses: z.array(CourseSchema).min(1),
});

export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type AcademyCatalog = z.infer<typeof AcademyCatalogSchema>;
