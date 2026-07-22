"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRequiredValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function register(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = getRequiredValue(formData, "fullName");
  const email = getRequiredValue(formData, "email").toLowerCase();
  const password = getRequiredValue(formData, "password");
  const confirmPassword = getRequiredValue(formData, "confirmPassword");

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Escribe tu nombre completo." };
  }

  if (!emailPattern.test(email)) {
    return { error: "Escribe un correo válido." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const confirmationUrl = new URL("/auth/callback", getSiteUrl());
  confirmationUrl.searchParams.set("next", "/onboarding");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  if (error) {
    return { error: "No fue posible crear tu cuenta. Intenta de nuevo." };
  }

  return {
    message:
      "Revisa tu correo y confirma tu cuenta para crear la agenda de tu negocio.",
  };
}

export async function signIn(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getRequiredValue(formData, "email").toLowerCase();
  const password = getRequiredValue(formData, "password");

  if (!emailPattern.test(email) || !password) {
    return { error: "Escribe tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "El correo o la contraseña no son correctos." };
  }

  redirect("/onboarding");
}
