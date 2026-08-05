import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "אימות אימייל" };

export default function VerifyEmailPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>בדקו את האימייל</CardTitle>
            <CardDescription>
              שלחנו קישור אימות (אם נדרש בסביבה שלכם). לאחר האימות תועברו
              להשלמת הפרופיל.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/onboarding">המשך ל־Onboarding</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">חזרה להתחברות</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
