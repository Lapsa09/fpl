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
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const manager = String(formData.get("manager") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!id || !name || !manager) return;
  await prisma.team.update({ where: { id }, data: { name, manager, active } });
  revalidatePath("/admin/equipos");
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/equipos");
}