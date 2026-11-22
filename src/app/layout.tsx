import type { Metadata } from "next";
import { Heebo, IBM_Plex_Sans } from "next/font/google";
import { AppChrome } from "@/components/layout/app-chrome";
import { AppProviders } from "@/components/providers";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Polymarket Edge Lab",
    template: "%s · Polymarket Edge Lab",
  },
  description:
    "פלטפורמת אנליטיקה עברית לשוקי תחזית ב־Polymarket — מחקר, מעקב ארנקים וסטטיסטיקה.",
  openGraph: {
    title: "Polymarket Edge Lab",
    description: "אנליטיקה מקצועית לשוקי תחזית — בעברית, RTL.",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${ibmPlex.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>
          <a href="#main-content" className="skip-to-content">
            דלג לתוכן
          </a>
          <AppChrome>{children}</AppChrome>
        </AppProviders>
      </body>
    </html>
  );
}
