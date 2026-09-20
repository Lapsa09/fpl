import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const plex = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Premier Arg · Fantasy League", template: "%s · Premier Arg" },
  description: "Noticias, posiciones y cortes de nuestra liga de Fantasy Premier League.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Premier Arg",
    title: "Premier Arg · Fantasy League",
    description: "Noticias, tabla de posiciones, cortes y simulador de nuestra liga de Fantasy Premier League.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Premier Arg Fantasy League",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premier Arg · Fantasy League",
    description: "Noticias, tabla de posiciones, cortes y simulador de nuestra liga de Fantasy Premier League.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:py-14">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}