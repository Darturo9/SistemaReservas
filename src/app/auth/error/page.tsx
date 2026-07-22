import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="message-page">
      <section className="message-card">
        <p className="eyebrow">No pudimos validar tu acceso</p>
        <h1>Ese enlace ya no esta disponible.</h1>
        <p>Solicita uno nuevo o inicia sesión para continuar.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/iniciar-sesion">
            Iniciar sesión
          </Link>
          <Link
            className="button button-secondary message-secondary"
            href="/registro"
          >
            Crear una cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
