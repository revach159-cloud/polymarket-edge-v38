import type { Metadata } from "next";
import { Syne } from "next/font/google";
import { AcademyShell } from "@/components/academy/layout/academy-shell";

const syne = Syne({
  variable: "--font-academy-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZIGZAG Trading Academy",
    template: "%s · ZIGZAG Academy",
  },
  description:
    "אקדמיית מסחר אינטראקטיבית בעברית — סימולציה וחינוך בלבד, ללא מסחר אמיתי.",
  openGraph: {
    title: "ZIGZAG Trading Academy",
    description: "לימוד מסחר מקצועי בעברית · סימולציה בלבד",
    locale: "he_IL",
    type: "website",
  },
};

export default function AcademyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${syne.variable} flex min-h-full flex-1 flex-col`}>
      <AcademyShell>{children}</AcademyShell>
    </div>
  );
}
