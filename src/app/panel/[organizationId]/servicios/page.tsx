import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

export default async function LegacyServicesPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <LegacyWorkspaceRoute
      destination="/panel/servicios"
      organizationId={organizationId}
    />
  );
}
