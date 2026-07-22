"use client";

import { useActionState } from "react";

import type { BookingApprovalState } from "@/app/panel/agenda/actions";

type BookingApprovalActionsProps = {
  action: (
    state: BookingApprovalState,
    formData: FormData,
  ) => Promise<BookingApprovalState>;
  bookingId: string;
};

const initialState: BookingApprovalState = {};

export function BookingApprovalActions({
  action,
  bookingId,
}: BookingApprovalActionsProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="booking-approval-actions">
      <input name="bookingId" type="hidden" value={bookingId} />
      <div className="booking-approval-buttons">
        <button
          className="button button-primary"
          disabled={isPending}
          name="decision"
          type="submit"
          value="confirmed"
        >
          {isPending ? "Guardando..." : "Confirmar"}
        </button>
        <button
          className="booking-approval-reject"
          disabled={isPending}
          name="decision"
          type="submit"
          value="cancelled"
        >
          Rechazar
        </button>
      </div>
      <p aria-live="polite" className="booking-approval-feedback">
        {state.error || state.message || ""}
      </p>
    </form>
  );
}
