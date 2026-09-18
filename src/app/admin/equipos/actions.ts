"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/components/admin/AdminShell";

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const manager = String(formData.get("manager") ?? "").trim();
  if (!name || !manager) return;
  await prisma.team.create({ data: { name, manager } });
  revalidatePath("/admin/equipos");
}

export async function updateTeam(formData: FormData) {
  await requireAdmin();
  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) return;
  const name = String(formData.get("name") ?? "").trim();
  const manager = String(formData.get("manager") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!name || !manager) return;
  await prisma.team.updateMany({ where: { id: rawId }, data: { name, manager, active } });
  revalidatePath("/admin/equipos");
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) return;
  await prisma.team.deleteMany({ where: { id: rawId } });
  revalidatePath("/admin/equipos");
}
