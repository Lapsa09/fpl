import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShareButtons } from "@/components/ShareButtons";
import { categoryLabel } from "@/components/NewsCard";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Noticia no encontrada" };
  const url = `${baseUrl}/noticias/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [{ url: "/opengraph-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : ["/opengraph-image.png"],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  const url = `${baseUrl}/noticias/${post.slug}`;
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/noticias" className="text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline">
        Volver a noticias
      </Link>
      <header className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">{categoryLabel(post.category)}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>
        {post.publishedAt && (
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.28em] text-muted">{formatDate(post.publishedAt)}</p>
        )}
      </header>
      {post.imageUrl ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed md:text-lg">{post.body}</div>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-muted">Compartir</span>
        <ShareButtons url={url} title={post.title} />
      </div>
    </article>
  );
}