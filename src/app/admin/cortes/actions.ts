"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createCut(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  if (!name) return;
  await prisma.cut.create({ data: { name, order } });
  revalidatePath("/admin/cortes");
}

export async function assignMatchdayToCut(formData: FormData) {
  await requireAdmin();
  const matchdayId = String(formData.get("matchdayId") ?? "").trim();
  const cutId = String(formData.get("cutId") ?? "").trim();
  if (!matchdayId) return;
  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { cutId: cutId === "" ? null : cutId },
  });
  revalidatePath("/admin/cortes");
}

export async function toggleCutClosed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const closed = formData.get("closed") === "true";
  if (!id) return;
  await prisma.cut.update({ where: { id }, data: { closed } });
  revalidatePath("/admin/cortes");
}