import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthDialog } from "@/components/AuthDialog";
import { SiteFooter, SiteHeader, StorageNotice, Toaster } from "@/components/SiteChrome";
import { Tracker } from "@/components/Tracker";
import "./globals.css";

/* One neutral grotesk for everything. next/font downloads it at build time and serves it from this site: no request to Google at runtime. */
const sans = Geist({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

/** Absolute base for link previews: NEXT_PUBLIC_SITE_URL, else the Vercel address, else local. */
const site =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3100");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { siteName: "Kollage", locale: "de_CH", images: [{ url: "/og?look=herbst-in-bern", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  title: { default: "Kollage – Stelle deinen Look zusammen", template: "%s · Kollage" },
  description: "Kombiniere Kleidung und Accessoires zu deinem Outfit und finde die passenden Shops. Preise in CHF, Lieferung in die Schweiz.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH" className={sans.variable}>
      <body>
        <a className="skip-link" href="#inhalt">
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <StorageNotice />
        <main id="inhalt" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <AuthDialog />
        <Toaster />
        <Tracker />
      </body>
    </html>
  );
}
