import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

type LegacyPageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function LegacyPanelPage({ params }: LegacyPageProps) {
  const { organizationId } = await params;

  return (
    <LegacyWorkspaceRoute
      destination="/panel"
      organizationId={organizationId}
    />
  );
}
