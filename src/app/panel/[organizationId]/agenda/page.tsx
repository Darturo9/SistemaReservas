import { LegacyWorkspaceRoute } from "@/components/legacy-workspace-route";

type LegacyAgendaPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    date?: string;
    locationId?: string;
    resourceId?: string;
    serviceId?: string;
  }>;
};

export default async function LegacyAgendaPage({
  params,
  searchParams,
}: LegacyAgendaPageProps) {
  const [{ organizationId }, filters] = await Promise.all([
    params,
    searchParams,
  ]);
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      query.set(key, value);
    }
  }

  return (
    <LegacyWorkspaceRoute
      destination={`/panel/agenda${query.size ? `?${query}` : ""}`}
      organizationId={organizationId}
    />
  );
}
