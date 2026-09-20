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

export const metadata: Metadata = {
  title: { default: "Premier Arg · Fantasy League", template: "%s · Premier Arg" },
  description: "Noticias, posiciones y cortes de nuestra liga de Fantasy Premier League.",
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