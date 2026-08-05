export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={
        compact
          ? "rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground"
          : "border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning-foreground md:text-sm"
      }
    >
      המערכת מספקת מידע וניתוח בלבד. היא אינה מבצעת עסקאות, אינה מהווה ייעוץ פיננסי ואינה מבטיחה
      תוצאה או רווח.
    </div>
  );
}
