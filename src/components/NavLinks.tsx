"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/", "Portada"],
  ["/noticias", "Noticias"],
  ["/tabla", "Tabla"],
  ["/cortes", "Cortes"],
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map(([href, label]) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
                : "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-white/10 hover:text-foreground"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}