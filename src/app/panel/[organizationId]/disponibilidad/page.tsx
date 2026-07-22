import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

export default async function LegacyAvailabilityPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <LegacyWorkspaceRoute
      destination="/panel/disponibilidad"
      organizationId={organizationId}
    />
  );
}
