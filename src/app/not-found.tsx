import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">העמוד לא נמצא</h1>
      <p className="text-muted-foreground">ייתכן שהקישור שגוי או שהשוק כבר לא זמין.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
