import { Container } from "@/components/layout/container";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";

export const metadata = { title: "הצהרת אחריות" };

export default function DisclaimerPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="max-w-3xl space-y-6 py-10">
        <h1 className="font-display text-3xl font-bold">הצהרת אחריות</h1>
        <DisclaimerBanner />
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Polymarket Edge Lab אינו מתווך, ברוקר או יועץ השקעות. המידע באתר
            מבוסס על מקורות ציבוריים ועשוי להיות חלקי, מעוכב או שגוי.
          </p>
          <p>
            אין לראות בנתונים, בבחירות Gold או בסטטיסטיקה המלצה לקנייה או
            מכירה של חוזים. אתם נושאים באחריות מלאה להחלטותיכם.
          </p>
          <p>
            אין קשר רשמי או אישור מ־Polymarket. סימנים מסחריים שייכים לבעליהם.
          </p>
        </div>
      </Container>
    </main>
  );
}
