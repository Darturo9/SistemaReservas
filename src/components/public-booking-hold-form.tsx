"use client";

import { type FormEvent, useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import type { PublicBookingHoldFormState } from "@/app/reservar/actions";
import { PublicBookingStepper } from "@/components/public-booking-stepper";

type PublicBookingHoldFormProps = {
  action: (
    state: PublicBookingHoldFormState,
    formData: FormData,
  ) => Promise<PublicBookingHoldFormState>;
  editBookingHref: string;
  serviceName: string;
  slotLabel: string;
};

const initialState: PublicBookingHoldFormState = {};

export function PublicBookingHoldForm({
  action,
  editBookingHref,
  serviceName,
  slotLabel,
}: PublicBookingHoldFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();
  const [step, setStep] = useState<2 | 3>(2);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  function continueToConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(3);
  }

  return (
    <section
      aria-labelledby="booking-details-title"
      className="public-booking-hold"
    >
      <div className="public-booking-hold-heading">
        <p className="eyebrow">Paso {step} de 3</p>
        <h2 id="booking-details-title">
          {step === 2 ? "Cuéntanos de ti." : "Valida tu cita por WhatsApp."}
        </h2>
        <p>
          {serviceName} · {slotLabel}
        </p>
      </div>

      <div className="public-booking-hold-content">
        <PublicBookingStepper
          currentStep={step}
          onStepChange={setStep}
          selectionHref={editBookingHref}
        />
        <form
          action={step === 3 ? formAction : undefined}
          className="public-booking-hold-form"
          onSubmit={step === 2 ? continueToConsent : undefined}
        >
          <input name="confirmationChannel" type="hidden" value="whatsapp" />

          {step === 2 ? (
            <>
              <label className="field">
                <span>Nombre completo</span>
                <input
                  autoComplete="name"
                  maxLength={120}
                  name="customerName"
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  value={customerName}
                />
              </label>
              <label className="field">
                <span>Correo electrónico</span>
                <input
                  autoComplete="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="field">
                <span>Teléfono</span>
                <div className="public-booking-phone-input">
                  <span aria-hidden="true">+502</span>
                  <input
                    autoComplete="tel-national"
                    inputMode="numeric"
                    maxLength={8}
                    name="phone"
                    onChange={(event) => setPhone(event.target.value)}
                    pattern="[0-9]{8}"
                    placeholder="12345678"
                    required
                    type="tel"
                    value={phone}
                  />
                </div>
              </label>
              <p className="field-hint">
                En el siguiente paso te explicaremos cómo validar tu cita por
                WhatsApp.
              </p>
              <div className="public-booking-form-actions">
                <a
                  className="public-booking-back-button"
                  href={editBookingHref}
                >
                  Volver a fecha y hora
                </a>
                <button className="button button-primary" type="submit">
                  Continuar a confirmación
                </button>
              </div>
            </>
          ) : (
            <>
              <input name="customerName" type="hidden" value={customerName} />
              <input name="email" type="hidden" value={email} />
              <input name="phone" type="hidden" value={phone} />
              <div className="public-booking-whatsapp-instructions">
                <strong>Esto es lo que sigue</strong>
                <ol>
                  <li>Te enviaremos un enlace de un solo uso por WhatsApp.</li>
                  <li>Abre el enlace para validar tu solicitud.</li>
                  <li>El negocio revisará tu cita después de validarla.</li>
                </ol>
                <p>El enlace vence en 15 minutos.</p>
              </div>
              <label className="public-booking-consent">
                <input
                  checked={whatsappConsent}
                  name="whatsappConsent"
                  onChange={(event) => setWhatsappConsent(event.target.checked)}
                  required
                  type="checkbox"
                />
                <span>
                  Acepto recibir por WhatsApp el enlace para validar esta cita.
                  Usaremos correo únicamente si WhatsApp no puede entregarlo.
                </span>
              </label>
              <div className="public-booking-form-actions">
                <button
                  className="public-booking-back-button"
                  onClick={() => setStep(2)}
                  type="button"
                >
                  Volver a mis datos
                </button>
                <a
                  className="public-booking-back-button"
                  href={editBookingHref}
                >
                  Cambiar fecha u horario
                </a>
              </div>
              <div aria-live="polite" className="form-feedback">
                {state.error ? (
                  <p className="form-error">{state.error}</p>
                ) : null}
                {state.slotUnavailable ? (
                  <button
                    className="button button-secondary"
                    onClick={() => router.refresh()}
                    type="button"
                  >
                    Actualizar horarios
                  </button>
                ) : null}
              </div>
              <button
                className="button button-primary"
                disabled={isPending}
                type="submit"
              >
                {isPending
                  ? "Enviando enlace por WhatsApp..."
                  : "Enviar enlace de validación"}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
