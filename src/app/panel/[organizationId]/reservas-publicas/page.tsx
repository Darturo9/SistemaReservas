import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

export default async function LegacyPublicBookingSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <LegacyWorkspaceRoute
      destination="/panel/reservas-publicas"
      organizationId={organizationId}
    />
  );
}
