"use client";

import { useEffect, useRef } from "react";

type LegacyWorkspaceRedirectProps = {
  action: (formData: FormData) => Promise<void>;
  organizationId: string;
};

export function LegacyWorkspaceRedirect({
  action,
  organizationId,
}: LegacyWorkspaceRedirectProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <main className="panel-page">
      <form action={action} ref={formRef}>
        <input name="organizationId" type="hidden" value={organizationId} />
        <p>Abriendo el espacio de trabajo...</p>
      </form>
    </main>
  );
}
