import Link from "next/link";
import { countLessons, listCourses } from "@/lib/academy/content";
import { academyTokens } from "@/lib/academy/design/tokens";
import { proposedMathDefaults } from "@/lib/academy/math/assumptions";

export default function AcademyHomePage() {
  const courses = listCourses();
  const lessonCount = countLessons();

  return (
    <div className="academy-page">
      <section className="academy-hero" aria-labelledby="academy-hero-title">
        <p className="academy-hero__eyebrow">{academyTokens.product}</p>
        <h1 id="academy-hero-title" className="academy-hero__brand">
          {academyTokens.brand}
        </h1>
        <p className="academy-hero__lede">
          אקדמיית מסחר אינטראקטיבית בעברית — תרגול סימולציה, שפת סיכון, ומשמעת
          מקצועית. בלי הפקדות ובלי הבטחות תשואה.
        </p>
        <div className="academy-hero__actions">
          <a href="#curriculum" className="academy-btn academy-btn--primary">
            לתכנית הלימודים
          </a>
          <Link href="/disclaimer" className="academy-btn academy-btn--ghost">
            הצהרת סימולציה
          </Link>
        </div>
      </section>

      <section
        id="curriculum"
        className="academy-section"
        aria-labelledby="curriculum-title"
      >
        <h2 id="curriculum-title">תכנית לימודים · Phase 1</h2>
        <p className="academy-section__lede">
          שלד תוכן מאומת (Zod) — {courses.length} קורס · {lessonCount} שיעורים
          כ־stubs. מנוע הסימולציה והשיעורים המלאים יגיעו בשלבים הבאים.
        </p>

        <ul className="academy-course-list">
          {courses.map((course) => (
            <li key={course.id} className="academy-course">
              <h3>{course.titleHe}</h3>
              <p>{course.subtitleHe}</p>
              <ol className="academy-module-list">
                {course.modules.map((mod) => (
                  <li key={mod.id}>
                    <span className="academy-module__title">{mod.titleHe}</span>
                    <span className="academy-module__meta">
                      {mod.lessons.length} שיעורים · {mod.summaryHe}
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section className="academy-section academy-section--muted" aria-labelledby="assumptions-title">
        <h2 id="assumptions-title">הנחות ZigZag · ממתינות לאישור</h2>
        <p className="academy-section__lede">
          מתודולוגיית reinforcement בלבד (לא Kelly). ברירות מחדל מוצעות — לא מיושמות
          במנוע עד אישור. פירוט מלא בתוכנית המימוש.
        </p>
        <dl className="academy-assumptions">
          <div>
            <dt>Reinforcement sizing</dt>
            <dd className="ltr-isolate">{proposedMathDefaults.reinforcementSizingMode}</dd>
          </div>
          <div>
            <dt>1x adverse interval</dt>
            <dd className="ltr-isolate">
              {(proposedMathDefaults.adverseMoveIntervalPct * 100).toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt>10x threshold</dt>
            <dd className="ltr-isolate">{proposedMathDefaults.tenXReinforcementThreshold}</dd>
          </div>
          <div>
            <dt>Max leverage (edu)</dt>
            <dd className="ltr-isolate">{proposedMathDefaults.maxEducationalLeverage}x</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
