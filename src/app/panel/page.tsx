import Link from "next/link";

import { getActiveWorkspace } from "@/lib/active-workspace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { organizationName, role } = await getActiveWorkspace();
  const roleLabel =
    role === "owner"
      ? "Propietario"
      : role === "admin"
        ? "Administrador"
        : "Personal";

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="workspace-title" className="workspace-shell">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Espacio operativo</p>
            <h1 id="workspace-title">{organizationName}</h1>
          </div>
          <div className="workspace-meta">
            <span>{roleLabel}</span>
            <Link href="/panel/organizaciones">Cambiar negocio</Link>
          </div>
        </header>

        <div className="workspace-lede">
          <p>Configuración comercial</p>
          <h2>Construye y revisa la base de tu agenda, paso a paso.</h2>
          <span>
            Tus reservas aún no están abiertas. Configura dónde, qué y cuándo
            pueden reservar tus clientes, y revisa los slots calculados.
          </span>
        </div>

        <ol className="workspace-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Sucursales</h3>
              <p>Define ubicación, contacto y zona horaria.</p>
              <Link className="workspace-step-action" href="/panel/sucursales">
                Configurar sucursales
              </Link>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Recursos</h3>
              <p>Agrega personas, salas, canchas o equipos reservables.</p>
              <Link className="workspace-step-action" href="/panel/recursos">
                Configurar recursos
              </Link>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Servicios y horarios</h3>
              <p>Conecta los servicios y establece su disponibilidad.</p>
              <Link className="workspace-step-action" href="/panel/servicios">
                Configurar servicios
              </Link>
              <Link
                className="workspace-step-action"
                href="/panel/disponibilidad"
              >
                Configurar disponibilidad
              </Link>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <h3>Motor de agenda</h3>
              <p>Comprueba los horarios disponibles para cada servicio.</p>
              <Link className="workspace-step-action" href="/panel/agenda">
                Revisar disponibilidad
              </Link>
            </div>
          </li>
          <li>
            <span>05</span>
            <div>
              <h3>Reservas públicas</h3>
              <p>
                Define el enlace que compartirás para consultar tus horarios.
              </p>
              <Link
                className="workspace-step-action"
                href="/panel/reservas-publicas"
              >
                Configurar enlace público
              </Link>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
