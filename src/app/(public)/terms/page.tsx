import { Container } from "@/components/layout/container";

export const metadata = { title: "תנאי שימוש" };

export default function TermsPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="prose-invert max-w-3xl space-y-4 py-10">
        <h1 className="font-display text-3xl font-bold">תנאי שימוש</h1>
        <p className="text-muted-foreground">
          השימוש ב־Polymarket Edge Lab כפוף לתנאים אלה. השירות מסופק כפי שהוא
          (&quot;as is&quot;) לצורכי מחקר ואנליטיקה בלבד.
        </p>
        <h2 className="font-display text-xl font-semibold">שימוש מותר</h2>
        <p className="text-sm text-muted-foreground">
          מותר לצפות בנתונים, לשמור מועדפים (כשמחוברים), ולנתח מידע ציבורי.
          אסור לנצל לרעה את המערכת, לנסות גישה לא מורשית, או להציג את המידע
          כייעוץ השקעות.
        </p>
        <h2 className="font-display text-xl font-semibold">חשבונות</h2>
        <p className="text-sm text-muted-foreground">
          אתם אחראים לשמירה על פרטי ההתחברות שלכם. אנו רשאים להשעות חשבונות
          במקרה של שימוש לרעה.
        </p>
        <h2 className="font-display text-xl font-semibold">שינויים</h2>
        <p className="text-sm text-muted-foreground">
          ייתכנו עדכונים לתנאים. המשך שימוש לאחר פרסום מהווה הסכמה.
        </p>
      </Container>
    </main>
  );
}
