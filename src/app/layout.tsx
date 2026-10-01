import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { AuthDialog } from "@/components/AuthDialog";
import { SiteFooter, SiteHeader, StorageNotice, Toaster } from "@/components/SiteChrome";
import "./globals.css";

/* Editorial voice. next/font downloads the files at build time and serves them from this site: no request to Google at runtime. */
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], display: "swap", variable: "--font-serif" });

export const metadata: Metadata = {
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
    <html lang="de-CH" className={serif.variable}>
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
      </body>
    </html>
  );
}
