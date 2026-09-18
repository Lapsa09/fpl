"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createMatchday(formData: FormData) {
  await requireAdmin();
  const number = Number(formData.get("number"));
  if (!Number.isInteger(number) || number < 1) return;
  await prisma.matchday.upsert({
    where: { number },
    update: {},
    create: { number },
  });
  revalidatePath("/admin/jornadas");
}

export async function savePoints(matchdayId: string, entries: { teamId: string; points: number }[]) {
  await requireAdmin();
  for (const entry of entries) {
    await prisma.matchdayPoints.upsert({
      where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
      update: { points: entry.points },
      create: { matchdayId, teamId: entry.teamId, points: entry.points },
    });
  }
  revalidatePath("/admin/jornadas");
}

export async function togglePlayed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const played = formData.get("played") === "true";
  await prisma.matchday.update({ where: { id }, data: { played } });
  revalidatePath("/admin/jornadas");
}