import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "שחזור סיסמה" };

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>שכחתי סיסמה</CardTitle>
            <CardDescription>
              נשלח קישור לאיפוס אם החשבון קיים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
