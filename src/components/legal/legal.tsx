export function Legal({ title, body }: { title: string; body: string[] }) {
  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {body.map((p) => (
        <p key={p} className="text-sm leading-relaxed text-muted-foreground">
          {p}
        </p>
      ))}
      <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        המערכת מספקת מידע וניתוח בלבד. היא אינה מבצעת עסקאות, אינה מהווה ייעוץ פיננסי ואינה מבטיחה
        תוצאה או רווח.
      </p>
    </article>
  );
}
