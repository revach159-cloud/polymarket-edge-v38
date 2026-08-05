"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.message);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="bg-[#070b14] p-8 text-[#e8eef7]">
        <h1 className="text-2xl font-bold">שגיאה</h1>
        <p className="mt-2 text-sm text-slate-400">אירעה תקלה. ניתן לנסות שוב.</p>
        <Button className="mt-4 min-h-11" onClick={reset}>
          ניסיון חוזר
        </Button>
      </body>
    </html>
  );
}
