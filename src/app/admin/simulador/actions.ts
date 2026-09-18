"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function saveEstimates(matchdayId: string, entries: { teamId: string; points: number }[]) {
  await requireAdmin();
  for (const entry of entries) {
    const points = Math.trunc(Number(entry.points));
    if (!Number.isFinite(points) || points < 0) continue;
    await prisma.estimate.upsert({
      where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
      update: { points },
      create: { matchdayId, teamId: entry.teamId, points },
    });
  }
  revalidatePath("/admin/simulador");
  revalidatePath("/simulador");
}