import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActiveWorkspace = {
  organizationId: string;
  organizationName: string;
  role: "admin" | "owner" | "staff";
  userId: string;
};

export async function getWorkspaceMemberships() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion");
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at");

  if (membershipsError) {
    throw membershipsError;
  }

  if (!memberships.length) {
    return { memberships: [], supabase, userId };
  }

  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name")
    .in(
      "id",
      memberships.map((membership) => membership.organization_id),
    )
    .order("name");

  if (organizationsError) {
    throw organizationsError;
  }

  const rolesByOrganizationId = new Map(
    memberships.map((membership) => [
      membership.organization_id,
      membership.role,
    ]),
  );
  const workspaces = organizations.flatMap((organization) => {
    const role = rolesByOrganizationId.get(organization.id);

    return role
      ? [
          {
            organizationId: organization.id,
            organizationName: organization.name,
            role,
            userId,
          },
        ]
      : [];
  });

  return { memberships: workspaces, supabase, userId };
}

export async function getActiveWorkspace(): Promise<ActiveWorkspace> {
  const { memberships, supabase, userId } = await getWorkspaceMemberships();

  if (!memberships.length) {
    redirect("/onboarding");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw profileError || new Error("No encontramos tu perfil.");
  }

  const activeWorkspace = memberships.find(
    (membership) =>
      membership.organizationId === profile.active_organization_id,
  );

  if (activeWorkspace) {
    return activeWorkspace;
  }

  if (memberships.length === 1) {
    return memberships[0];
  }

  redirect("/panel/organizaciones");
}
