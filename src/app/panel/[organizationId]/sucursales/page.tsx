import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

export default async function LegacyLocationsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <LegacyWorkspaceRoute
      destination="/panel/sucursales"
      organizationId={organizationId}
    />
  );
}
