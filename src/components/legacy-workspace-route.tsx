import { notFound } from "next/navigation";

import { selectLegacyWorkspace } from "@/app/panel/organizaciones/actions";
import { getWorkspaceMemberships } from "@/lib/active-workspace";

import { LegacyWorkspaceRedirect } from "./legacy-workspace-redirect";

type LegacyWorkspaceRouteProps = {
  destination: string;
  organizationId: string;
};

export async function LegacyWorkspaceRoute({
  destination,
  organizationId,
}: LegacyWorkspaceRouteProps) {
  const { memberships } = await getWorkspaceMemberships();

  if (
    !memberships.some(
      (membership) => membership.organizationId === organizationId,
    )
  ) {
    notFound();
  }

  return (
    <LegacyWorkspaceRedirect
      action={selectLegacyWorkspace.bind(null, destination)}
      organizationId={organizationId}
    />
  );
}
