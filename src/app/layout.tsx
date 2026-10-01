import type { Metadata, Viewport } from "next";
import { AuthDialog } from "@/components/AuthDialog";
import { SiteFooter, SiteHeader, Toaster } from "@/components/SiteChrome";
import "./globals.css";

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
    <html lang="de-CH">
      <body>
        <a className="skip-link" href="#inhalt">
          Zum Inhalt springen
        </a>
        <SiteHeader />
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
