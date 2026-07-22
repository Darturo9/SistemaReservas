import Link from "next/link";

import { register } from "@/app/auth-actions";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="wordmark" href="/">
          <span aria-hidden="true" className="wordmark-mark">
            R
          </span>
          Reserva
        </Link>
        <div className="auth-intro-copy">
          <p className="eyebrow">Registro abierto</p>
          <h1>La agenda de tu negocio empieza con una cuenta.</h1>
          <p>
            Crea el espacio para tu equipo, configura tus horarios y comparte
            una reserva clara con cada cliente.
          </p>
        </div>
        <p className="auth-aside-note">Sin tarjetas ni compromisos hoy.</p>
      </section>

      <section aria-labelledby="register-title" className="auth-panel">
        <div className="auth-panel-heading">
          <p className="eyebrow">Primer paso</p>
          <h2 id="register-title">Crea tu cuenta</h2>
          <p>Te enviaremos un enlace para confirmar que este correo es tuyo.</p>
        </div>
        <AuthForm action={register} mode="register" />
      </section>
    </main>
  );
}
