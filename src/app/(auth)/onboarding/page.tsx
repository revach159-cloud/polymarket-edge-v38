import { redirect } from "next/navigation";
import { updateProfile } from "@/actions/favorites";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentProfile } from "@/services/auth";

export const metadata = { title: "השלמת פרופיל" };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/onboarding");

  async function complete(formData: FormData) {
    "use server";
    await updateProfile(formData);
    redirect("/account");
  }

  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>ברוכים הבאים</CardTitle>
            <CardDescription>
              השלימו את שם התצוגה כדי להתחיל
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={complete} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">שם תצוגה</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={profile.displayName ?? ""}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                סיום והמשך
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
