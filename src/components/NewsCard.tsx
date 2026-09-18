import Link from "next/link";

export function NewsCard({
  slug, title, excerpt, imageUrl, category,
}: {
  slug: string; title: string; excerpt: string; imageUrl: string | null; category: string;
}) {
  return (
    <article className="overflow-hidden rounded border">
      <Link href={`/noticias/${slug}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="h-48 w-full bg-neutral-100" />
        )}
        <div className="p-4">
          <span className="text-xs font-semibold uppercase text-neutral-500">{category}</span>
          <h2 className="mt-1 text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm text-neutral-600">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}