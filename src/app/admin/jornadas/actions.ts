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
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const points = Math.max(0, Math.trunc(Number(entry.points)));
      if (!Number.isFinite(points)) continue;
      await tx.matchdayPoints.upsert({
        where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
        update: { points },
        create: { matchdayId, teamId: entry.teamId, points },
      });
    }
  });
  revalidatePath("/admin/jornadas");
}

export async function togglePlayed(formData: FormData) {
  await requireAdmin();
  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) return;
  const id = rawId;
  const played = formData.get("played") === "true";
  await prisma.matchday.updateMany({ where: { id }, data: { played } });
  revalidatePath("/admin/jornadas");
}
