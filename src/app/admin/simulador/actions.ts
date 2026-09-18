"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function saveEstimates(matchdayId: string, entries: { teamId: string; points: number }[]) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const points = Math.max(0, Math.trunc(Number(entry.points)));
      if (!Number.isFinite(points)) continue;
      await tx.estimate.upsert({
        where: { matchdayId_teamId: { matchdayId, teamId: entry.teamId } },
        update: { points },
        create: { matchdayId, teamId: entry.teamId, points },
      });
    }
  });
  revalidatePath("/admin/simulador");
  revalidatePath("/simulador");
}
