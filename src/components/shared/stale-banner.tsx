import { Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StaleBanner({
  message = "חלק מהנתונים עלולים להיות לא מעודכנים. מציגים את המידע האחרון שהתקבל בהצלחה.",
}: {
  message?: string;
}) {
  return (
    <Alert variant="warning">
      <Clock className="h-4 w-4" />
      <AlertTitle>נתונים ישנים / חלקיים</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
