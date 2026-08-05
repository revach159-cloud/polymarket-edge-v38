import { SignupForm } from "@/components/auth/signup-form";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "הרשמה" };

export default function SignupPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>הרשמה</CardTitle>
            <CardDescription>יצירת חשבון Polymarket Edge Lab</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
