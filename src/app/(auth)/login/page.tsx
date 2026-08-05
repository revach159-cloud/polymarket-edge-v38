import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "התחברות" };

export default function LoginPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>התחברות</CardTitle>
            <CardDescription>
              היכנסו לחשבון כדי לשמור מועדפים ולגשת ל־Gold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
