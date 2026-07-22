import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

type LegacyResourcesPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ sucursal?: string }>;
};

export default async function LegacyResourcesPage({
  params,
  searchParams,
}: LegacyResourcesPageProps) {
  const [{ organizationId }, { sucursal }] = await Promise.all([
    params,
    searchParams,
  ]);
  const query = new URLSearchParams();

  if (sucursal) {
    query.set("sucursal", sucursal);
  }

  return (
    <LegacyWorkspaceRoute
      destination={`/panel/recursos${query.size ? `?${query}` : ""}`}
      organizationId={organizationId}
    />
  );
}
