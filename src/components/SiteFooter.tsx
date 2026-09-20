import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted">
        <p className="text-base font-black uppercase tracking-tight text-foreground">
          Premier <span className="text-accent">Arg</span>
          <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
            Amigos Fútbol Fantasía Siempre
          </span>
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p>Noticias, tabla de posiciones, cortes y simulador.</p>
          <Link href="/login" className="text-muted underline-offset-4 hover:text-foreground hover:underline">
            Acceso admin
          </Link>
        </div>
      </div>
    </footer>
  );
}