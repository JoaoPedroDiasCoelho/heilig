import type { Metadata } from "next";
import { Archivo, Permanent_Marker } from "next/font/google";
import ScrollToTopOnReload from "@/components/ScrollToTopOnReload";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Heilig® — camisetas oversized",
  description:
    "Camisetas oversized de algodão pesado, caimento amplo e acabamento preciso.",
  openGraph: {
    title: "Heilig® — camisetas oversized",
    description: "Camisetas oversized de algodão pesado, caimento amplo e acabamento preciso.",
    url: SITE_URL,
    siteName: "Heilig®",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${archivo.variable} ${permanentMarker.variable}`}>
        <ScrollToTopOnReload />
        {children}
      </body>
    </html>
  );
}
