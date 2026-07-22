import Link from "next/link";

import { signIn } from "@/app/auth-actions";
import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
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
          <p className="eyebrow">Tu espacio de trabajo</p>
          <h1>Vuelve a una agenda que cabe en tu cabeza.</h1>
          <p>
            Consulta tu negocio, tu equipo y las próximas reservas desde un solo
            lugar.
          </p>
        </div>
      </section>

      <section aria-labelledby="sign-in-title" className="auth-panel">
        <div className="auth-panel-heading">
          <p className="eyebrow">Bienvenido</p>
          <h2 id="sign-in-title">Inicia sesión</h2>
          <p>Usa el correo y la contraseña de tu cuenta.</p>
        </div>
        <AuthForm action={signIn} mode="sign-in" />
      </section>
    </main>
  );
}
