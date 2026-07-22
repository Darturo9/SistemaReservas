type PublicBookingStepperProps = {
  currentStep: 1 | 2 | 3;
  onStepChange?: (step: 2) => void;
  selectionHref?: string;
};

const steps = ["Fecha y hora", "Tus datos", "Confirma WhatsApp"];

export function PublicBookingStepper({
  currentStep,
  onStepChange,
  selectionHref,
}: PublicBookingStepperProps) {
  return (
    <ol aria-label="Progreso de la reserva" className="public-booking-stepper">
      {steps.map((label, index) => {
        const step = (index + 1) as PublicBookingStepperProps["currentStep"];
        const isCurrent = step === currentStep;
        const isComplete = step < currentStep;

        const content = (
          <>
            <span>{step}</span>
            <strong>{label}</strong>
          </>
        );

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className={
              isCurrent
                ? "public-booking-stepper-current"
                : isComplete
                  ? "public-booking-stepper-complete"
                  : undefined
            }
            key={label}
          >
            {step === 1 && isComplete && selectionHref ? (
              <a className="public-booking-stepper-item" href={selectionHref}>
                {content}
              </a>
            ) : step === 2 && isComplete && onStepChange ? (
              <button
                className="public-booking-stepper-item"
                onClick={() => onStepChange(2)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div className="public-booking-stepper-item">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
