import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="text-xl font-black uppercase leading-none tracking-tight">
            Premier <span className="text-accent">Arg</span>
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.28em] text-muted sm:inline">
            Fantasy League
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}