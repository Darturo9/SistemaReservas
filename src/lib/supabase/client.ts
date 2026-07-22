"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export function createClient() {
  const { publishableKey, url } = getSupabaseEnvironment();

  return createBrowserClient<Database>(url, publishableKey);
}
