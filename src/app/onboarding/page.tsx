import { redirect } from "next/navigation";

import { createOrganization } from "@/app/onboarding/actions";
import { OnboardingForm } from "@/components/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion");
  }

  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count) {
    redirect("/panel");
  }

  return (
    <main className="message-page onboarding-page">
      <section
        aria-labelledby="onboarding-title"
        className="message-card onboarding-card"
      >
        <p className="eyebrow">Ya casi</p>
        <h1 id="onboarding-title">
          Ponle nombre a la agenda que vas a construir.
        </h1>
        <p>
          Este será el espacio privado de tu negocio. Tu cuenta quedará como
          propietaria y podrás invitar a tu equipo después.
        </p>
        <OnboardingForm action={createOrganization} />
      </section>
    </main>
  );
}
