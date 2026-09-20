"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";
import { isPrizeTone } from "@/lib/domain/prizes";

function revalidatePrizes() {
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/admin/premios");
}

function parseRule(formData: FormData) {
  const fromRank = Math.max(1, Math.floor(Number(formData.get("fromRank") ?? 1)));
  const toRank = Math.max(fromRank, Math.floor(Number(formData.get("toRank") ?? fromRank)));
  const text = String(formData.get("text") ?? "").trim();
  const rawTone = String(formData.get("tone") ?? "steel");
  if (!text || !Number.isFinite(fromRank) || !Number.isFinite(toRank)) return null;
  return { fromRank, toRank, text, tone: isPrizeTone(rawTone) ? rawTone : "steel" };
}

export async function createPrizeRule(formData: FormData) {
  await requireAdmin();
  const rule = parseRule(formData);
  if (!rule) return;
  await prisma.prizeRule.create({ data: rule });
  revalidatePrizes();
}

export async function updatePrizeRule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const rule = parseRule(formData);
  if (!id || !rule) return;
  await prisma.prizeRule.updateMany({ where: { id }, data: rule });
  revalidatePrizes();
}

export async function deletePrizeRule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await prisma.prizeRule.deleteMany({ where: { id } });
  revalidatePrizes();
}
