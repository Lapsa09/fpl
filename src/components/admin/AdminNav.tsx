"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Resumen"],
  ["/admin/equipos", "Equipos"],
  ["/admin/jornadas", "Jornadas"],
  ["/admin/cortes", "Cortes"],
  ["/admin/premios", "Premios"],
  ["/admin/noticias", "Noticias"],
  ["/admin/simulador", "Simulador"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 text-sm">
      {links.map(([href, label]) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "block rounded-lg bg-accent px-3 py-2 font-semibold text-accent-ink"
                : "block rounded-lg px-3 py-2 text-muted hover:bg-white/10 hover:text-foreground"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
