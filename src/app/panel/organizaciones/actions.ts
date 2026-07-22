"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getWorkspaceMemberships } from "@/lib/active-workspace";

const legacyDestinations = new Set([
  "/panel",
  "/panel/sucursales",
  "/panel/recursos",
  "/panel/servicios",
  "/panel/disponibilidad",
  "/panel/agenda",
  "/panel/reservas-publicas",
]);

async function persistActiveWorkspace(
  organizationId: string,
  destination: string,
) {
  const { memberships, supabase, userId } = await getWorkspaceMemberships();

  if (
    !memberships.some(
      (membership) => membership.organizationId === organizationId,
    )
  ) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_organization_id: organizationId })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/panel");
  redirect(destination);
}

export async function selectActiveWorkspace(formData: FormData) {
  const organizationId = formData.get("organizationId");

  if (typeof organizationId !== "string" || !organizationId) {
    return;
  }

  await persistActiveWorkspace(organizationId, "/panel");
}

export async function selectLegacyWorkspace(
  destination: string,
  formData: FormData,
) {
  const organizationId = formData.get("organizationId");
  const legacyDestination = new URL(destination, "https://panel.local");

  if (
    typeof organizationId !== "string" ||
    !organizationId ||
    !legacyDestinations.has(legacyDestination.pathname)
  ) {
    return;
  }

  await persistActiveWorkspace(
    organizationId,
    `${legacyDestination.pathname}${legacyDestination.search}`,
  );
}
