import { describe, expect, it } from "vitest";
import {
  AcademyCatalogSchema,
  academyCatalog,
  countLessons,
  getCourseBySlug,
  listCourses,
} from "@/lib/academy/content";
import { proposedMathDefaults } from "@/lib/academy/math/assumptions";
import { academyTokens } from "@/lib/academy/design/tokens";

describe("academy content catalog", () => {
  it("parses stub catalog against Zod schema", () => {
    const parsed = AcademyCatalogSchema.parse(academyCatalog);
    expect(parsed.product).toBe("zigzag-trading-academy");
    expect(parsed.courses.length).toBeGreaterThan(0);
  });

  it("marks every course and lesson as simulation-only", () => {
    for (const course of listCourses()) {
      expect(course.simulationOnly).toBe(true);
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          expect(lesson.simulationOnly).toBe(true);
        }
      }
    }
  });

  it("resolves foundations course and counts lessons", () => {
    const course = getCourseBySlug("foundations");
    expect(course?.titleHe).toContain("יסודות");
    expect(countLessons()).toBeGreaterThanOrEqual(2);
  });
});

describe("academy foundation constants", () => {
  it("exposes brand tokens", () => {
    expect(academyTokens.brand).toBe("ZIGZAG");
    expect(academyTokens.productHe).toMatch(/אקדמי/);
  });

  it("keeps math defaults flagged as unconfirmed", () => {
    expect(proposedMathDefaults.awaitingOwnerConfirmation).toBe(true);
    expect(proposedMathDefaults.maxEducationalLeverage).toBe(10);
  });
});
