import { redirect } from "next/navigation";
import { FavoritesList } from "@/components/account/favorites-list";
import { ProfileForm } from "@/components/account/profile-form";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile, getFavoriteMarkets } from "@/services/auth";

export const metadata = { title: "חשבון" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">חשבון</h1>
        <p className="text-sm text-muted-foreground">
          יש להגדיר Supabase כדי להפעיל הרשמה, פרופיל ומועדפים.
        </p>
        <Button asChild className="min-h-11">
          <a href="/login">התחברות</a>
        </Button>
      </div>
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/account");

  const favorites = await getFavoriteMarkets(profile.id);
  const sp = await searchParams;

  return (
    <div className="flex gap-8">
      <Sidebar isAdmin={profile.role === "admin"} />
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">החשבון שלי</h1>
          <Badge variant={profile.tier === "gold" ? "gold" : "secondary"}>
            {profile.tier}
          </Badge>
          {profile.role === "admin" ? (
            <Badge variant="default">admin</Badge>
          ) : null}
        </div>

        {sp.denied === "admin" ? (
          <p className="text-sm text-warning">אין הרשאת מנהל לעמוד המבוקש.</p>
        ) : null}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">פרופיל</TabsTrigger>
            <TabsTrigger value="favorites">מועדפים</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>פרטי פרופיל</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="favorites">
            <FavoritesList markets={favorites} />
          </TabsContent>
        </Tabs>

        <form action="/auth/signout" method="post">
          <Button type="submit" variant="destructive" className="min-h-11">
            יציאה
          </Button>
        </form>
      </div>
    </div>
  );
}
