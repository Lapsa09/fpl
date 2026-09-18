"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = base || "noticia";
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${n++}`;
  }
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function saveWithUniqueSlug<T>(
  base: string,
  ignoreId: string | undefined,
  save: (slug: string) => Promise<T>,
) {
  let slug = await uniqueSlug(base, ignoreId);
  for (let attempt = 0; ; attempt++) {
    try {
      return await save(slug);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      if (attempt >= 9) throw error;
      slug = await uniqueSlug(base, ignoreId);
    }
  }
}

function readPost(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    category: String(formData.get("category") ?? "GENERAL") as
      | "TRANSFERS" | "DECLARATIONS" | "STATEMENTS" | "GENERAL",
    body: String(formData.get("body") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

export async function createPost(formData: FormData) {
  await requireAdmin();
  const data = readPost(formData);
  if (!data.title || !data.excerpt || !data.body) return;
  const post = await saveWithUniqueSlug(slugify(data.title), undefined, (slug) =>
    prisma.post.create({
      data: { ...data, slug, publishedAt: data.published ? new Date() : null },
    }),
  );
  revalidatePath("/admin/noticias");
  redirect(`/admin/noticias/${post.id}`);
}

export async function updatePost(formData: FormData) {
  await requireAdmin();
  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) return;
  const data = readPost(formData);
  const current = await prisma.post.findUnique({ where: { id: rawId } });
  if (!current || !data.title || !data.excerpt || !data.body) return;
  const slug = await saveWithUniqueSlug(slugify(data.title), rawId, (slug) =>
    prisma.post.update({
      where: { id: rawId },
      data: {
        ...data,
        slug,
        publishedAt: data.published ? current.publishedAt ?? new Date() : null,
      },
    }),
  );
  revalidatePath("/admin/noticias");
  revalidatePath(`/noticias/${slug}`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) return;
  await prisma.post.deleteMany({ where: { id: rawId } });
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}
