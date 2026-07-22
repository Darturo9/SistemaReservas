"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const value = formData.get("organizationName");
  const organizationName = typeof value === "string" ? value.trim() : "";

  if (organizationName.length < 2 || organizationName.length > 120) {
    return { error: "Escribe el nombre de tu negocio." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { error } = await supabase.rpc("create_organization", {
    p_name: organizationName,
  });

  if (error) {
    return { error: "No fue posible crear tu negocio. Intenta de nuevo." };
  }

  redirect("/panel");
}
