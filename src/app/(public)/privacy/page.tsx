import { Container } from "@/components/layout/container";

export const metadata = { title: "מדיניות פרטיות" };

export default function PrivacyPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="max-w-3xl space-y-4 py-10">
        <h1 className="font-display text-3xl font-bold">מדיניות פרטיות</h1>
        <p className="text-muted-foreground">
          אנו אוספים מינימום מידע הנדרש להפעלת החשבון (אימייל, העדפות, מועדפים)
          דרך ספקי אימות כמו Supabase.
        </p>
        <h2 className="font-display text-xl font-semibold">מה נשמר</h2>
        <ul className="list-disc space-y-1 pe-5 text-sm text-muted-foreground">
          <li>פרטי חשבון בסיסיים</li>
          <li>מועדפים והגדרות פרופיל</li>
          <li>יומני ביקורת לפעולות מנהל (אם רלוונטי)</li>
        </ul>
        <h2 className="font-display text-xl font-semibold">שיתוף</h2>
        <p className="text-sm text-muted-foreground">
          איננו מוכרים מידע אישי. נתוני שוק נמשכים מממשקי Polymarket הציבוריים.
        </p>
        <h2 className="font-display text-xl font-semibold">יצירת קשר</h2>
        <p className="text-sm text-muted-foreground">
          לשאלות פרטיות — דרך עמוד{" "}
          <a href="/contact" className="text-primary hover:underline">
            צור קשר
          </a>
          .
        </p>
      </Container>
    </main>
  );
}
