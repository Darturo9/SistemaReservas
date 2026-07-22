import Link from "next/link";
import { redirect } from "next/navigation";

import { getWorkspaceMemberships } from "@/lib/active-workspace";

import { selectActiveWorkspace } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceSelectorPage() {
  const { memberships } = await getWorkspaceMemberships();

  if (!memberships.length) {
    redirect("/onboarding");
  }

  if (memberships.length === 1) {
    redirect("/panel");
  }

  return (
    <main className="panel-page panel-selector-page">
      <section
        aria-labelledby="business-selector-title"
        className="panel-selector"
      >
        <div className="panel-selector-intro">
          <p className="eyebrow">Tus espacios</p>
          <h1 id="business-selector-title">
            Elige el negocio que vas a operar.
          </h1>
          <p>
            Cada agenda mantiene sus servicios, sucursales, recursos y reservas
            separados.
          </p>
        </div>
        <div className="panel-selector-list">
          {memberships.map((membership) => (
            <form
              action={selectActiveWorkspace}
              key={membership.organizationId}
            >
              <input
                name="organizationId"
                type="hidden"
                value={membership.organizationId}
              />
              <button className="organization-choice" type="submit">
                <span className="organization-choice-label">Negocio</span>
                <strong>{membership.organizationName}</strong>
                <span>
                  {membership.role === "owner"
                    ? "Propietario"
                    : membership.role === "admin"
                      ? "Administrador"
                      : "Personal"}
                </span>
              </button>
            </form>
          ))}
        </div>
        <Link className="panel-home-link" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
