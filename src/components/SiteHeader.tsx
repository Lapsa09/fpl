import Link from "next/link";

const links = [
  ["/", "Portada"],
  ["/noticias", "Noticias"],
  ["/tabla", "Tabla"],
  ["/cortes", "Cortes"],
  ["/simulador", "Simulador"],
] as const;

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-black uppercase tracking-tight">Liga FPL</Link>
        <nav className="flex gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
