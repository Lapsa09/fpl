import Link from "next/link";
import { formatDate } from "@/lib/format";

export const CATEGORY_LABELS: Record<string, string> = {
  STATEMENTS: "Comunicados",
  DECLARATIONS: "Declaraciones",
  TRANSFERS: "Traspasos",
  GENERAL: "General",
};

export const POST_CATEGORIES = [
  ["STATEMENTS", "Comunicados"],
  ["DECLARATIONS", "Declaraciones"],
  ["TRANSFERS", "Traspasos"],
  ["GENERAL", "General"],
] as const;

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function NewsCard({
  slug, title, excerpt, category, publishedAt, index,
}: {
  slug: string; title: string; excerpt: string; category: string;
  publishedAt: Date | null; index?: number;
}) {
  return (
    <article className="border-b border-line/70 last:border-0">
      <Link href={`/noticias/${slug}`} className="group flex items-baseline gap-4 py-5">
        {index !== undefined && (
          <span className="hidden shrink-0 font-mono text-sm text-muted sm:block">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-[0.14em] text-accent">{categoryLabel(category)}</span>
            {publishedAt && <span className="text-muted">{formatDate(publishedAt)}</span>}
          </div>
          <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-accent">{title}</h2>
          <p className="mt-1 hidden text-sm text-muted sm:block">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}