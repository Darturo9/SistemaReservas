const proofPoints = [
  "Horarios sin cruces",
  "Clientes verificados",
  "Control por equipo",
];

const schedule = [
  { client: "Mariana López", service: "Consulta inicial", time: "09:30" },
  { client: "Carlos Méndez", service: "Sesión individual", time: "11:00" },
  { client: "Paola Reyes", service: "Servicio premium", time: "15:30" },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav aria-label="Navegación principal" className="nav-shell">
          <a className="wordmark" href="#inicio">
            <span aria-hidden="true" className="wordmark-mark">
              R
            </span>
            Reserva
          </a>
          <a className="nav-link" href="/registro">
            Crea tu negocio
          </a>
        </nav>

        <div className="hero-grid" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Agenda para negocios que no se detienen</p>
            <h1>Tu tiempo es el servicio. Que reservarlo sea fácil.</h1>
            <p className="lede">
              Una agenda clara para profesionales y comercios: tus clientes
              eligen, confirman sus datos y reservan sin cruces.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/registro">
                Crea tu negocio
              </a>
              <a className="button button-secondary" href="#como-funciona">
                Ver cómo funciona
              </a>
            </div>
            <p className="signup-note">
              Registro abierto para negocios. Empieza con tu correo.
            </p>
            <ul aria-label="Beneficios principales" className="proof-list">
              {proofPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div aria-label="Vista previa de agenda" className="agenda-card">
            <div className="agenda-header">
              <div>
                <p className="agenda-label">Agenda del día</p>
                <h2>Miércoles, 22 de julio</h2>
              </div>
              <span className="availability-pill">3 disponibles</span>
            </div>
            <div className="schedule-list">
              {schedule.map((booking) => (
                <article className="booking-row" key={booking.time}>
                  <time dateTime={`2026-07-22T${booking.time}:00-06:00`}>
                    {booking.time}
                  </time>
                  <div>
                    <h3>{booking.client}</h3>
                    <p>{booking.service}</p>
                  </div>
                  <span
                    aria-label="Reserva confirmada"
                    className="booking-status"
                  />
                </article>
              ))}
            </div>
            <div className="agenda-footer">
              <span>Hoy</span>
              <strong>6 reservas confirmadas</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="como-funciona">
        <p className="eyebrow">Una misma base, muchos negocios</p>
        <div className="section-heading">
          <h2>Menos coordinación. Más atención al cliente.</h2>
          <p>
            Configura tus servicios, define los horarios de tu equipo y deja que
            cada reserva llegue con información validada.
          </p>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <h3>Configura tu operación</h3>
            <p>Servicios, recursos, sucursales, horarios y descansos.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Comparte tu enlace</h3>
            <p>Tus clientes escogen la hora y el profesional disponible.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Recibe reservas confiables</h3>
            <p>Correo y teléfono verificados antes de confirmar.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
