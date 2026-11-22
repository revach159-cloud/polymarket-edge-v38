import {
  AcademyCatalogSchema,
  type AcademyCatalog,
  type Course,
} from "@/lib/academy/content/schemas";

/**
 * Phase 1 stub catalog — structure only.
 * Full curriculum content lands in Phase 2+.
 */
const rawCatalog = {
  version: "0.1.0-phase1",
  product: "zigzag-trading-academy" as const,
  courses: [
    {
      id: "course-foundations",
      slug: "foundations",
      titleHe: "יסודות מסחר אחראי",
      subtitleHe: "סימולציה · ניהול סיכון · שפה מקצועית",
      locale: "he" as const,
      simulationOnly: true as const,
      modules: [
        {
          id: "mod-risk-language",
          slug: "risk-language",
          titleHe: "שפת הסיכון",
          summaryHe: "R-multiple, stop-loss ומושגי יסוד — בעברית עם מונחים באנגלית.",
          order: 0,
          lessons: [
            {
              id: "lesson-welcome",
              slug: "welcome",
              titleHe: "ברוכים הבאים ל־ZIGZAG",
              summaryHe: "מהי האקדמיה, מהי סימולציה, ומה לא נלמד כאן.",
              estimatedMinutes: 8,
              simulationOnly: true as const,
              blocks: [
                {
                  type: "callout" as const,
                  id: "sim-disclaimer",
                  tone: "sim" as const,
                  title: "סימולציה בלבד",
                  body: "אין כאן מסחר אמיתי, הפקדות, או הבטחת תשואה. כל תרגול הוא חינוכי.",
                },
                {
                  type: "prose" as const,
                  id: "intro",
                  markdown:
                    "ZIGZAG Trading Academy מלמדת חשיבה מקצועית על סיכון ומשמעת — לא טיפים לרווח מהיר.",
                },
                {
                  type: "term" as const,
                  id: "term-r-multiple",
                  termEn: "R-multiple",
                  termHe: "מכפיל R",
                  definitionHe:
                    "תוצאת עסקה ביחס לסיכון שהוגדר מראש. +2R = רווח בגובה פי שניים מהסיכון.",
                },
              ],
            },
          ],
        },
        {
          id: "mod-zigzag-preview",
          slug: "zigzag-method-preview",
          titleHe: "תצוגה מקדימה · שיטת ZigZag",
          summaryHe: "Reinforcement, מעבר 1x→10x, ומימוש 75% — אחרי אישור הנחות המתודה.",
          order: 1,
          lessons: [
            {
              id: "lesson-zigzag-placeholder",
              slug: "zigzag-assumptions-placeholder",
              titleHe: "ממתינים לאישור מתודולוגיית ZigZag",
              summaryHe:
                "מצבי reinforcement, מרווח 10% ל־1x adverse, סף 10x, ומסלולי מינוף נפרדים — טעונים אישור.",
              estimatedMinutes: 5,
              simulationOnly: true as const,
              blocks: [
                {
                  type: "callout" as const,
                  id: "awaiting-math",
                  tone: "warning" as const,
                  title: "טעון אישור",
                  body: "הנחות המתודה (לא Kelly) מתועדות בתוכנית המימוש וממתינות לאישור בעלים לפני מנוע הסימולציה.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const academyCatalog: AcademyCatalog = AcademyCatalogSchema.parse(rawCatalog);

export function listCourses(): Course[] {
  return academyCatalog.courses;
}

export function getCourseBySlug(slug: string): Course | undefined {
  return academyCatalog.courses.find((course) => course.slug === slug);
}

export function countLessons(catalog: AcademyCatalog = academyCatalog): number {
  return catalog.courses.reduce(
    (courseTotal, course) =>
      courseTotal +
      course.modules.reduce((moduleTotal, mod) => moduleTotal + mod.lessons.length, 0),
    0,
  );
}
