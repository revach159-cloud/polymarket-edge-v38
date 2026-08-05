"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold">אירעה שגיאה</h1>
      <p className="text-muted-foreground">לא הצלחנו לטעון את העמוד. נסו שוב.</p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
      >
        נסיון חוזר
      </button>
      <p className="sr-only">{error.message}</p>
    </div>
  );
}
