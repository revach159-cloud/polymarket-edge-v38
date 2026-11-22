import Link from "next/link";

export function AcademyFooter() {
  return (
    <footer className="academy-footer">
      <div className="academy-footer__inner">
        <p>
          ZIGZAG Trading Academy · פלטפורמת לימוד וסימולציה. אינה בית השקעות ואינה
          מבצעת עסקאות.
        </p>
        <div className="academy-footer__links">
          <Link href="/">חזרה ל־Edge Lab</Link>
          <Link href="/terms">תנאי שימוש</Link>
          <Link href="/privacy">פרטיות</Link>
        </div>
      </div>
    </footer>
  );
}
