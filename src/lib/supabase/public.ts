import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export function createPublicClient() {
  const { publishableKey, url } = getSupabaseEnvironment();

  return createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
