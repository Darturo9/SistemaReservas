const missingSupabaseEnvironmentMessage =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.";

const missingSiteUrlEnvironmentMessage =
  "The site URL is not configured. Add NEXT_PUBLIC_SITE_URL to .env.local.";

export function getSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(missingSupabaseEnvironmentMessage);
  }

  return { publishableKey, url };
}

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(missingSiteUrlEnvironmentMessage);
  }

  return new URL(siteUrl).origin;
}
