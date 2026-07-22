import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseEnvironment } from "@/lib/supabase/env";

function getSafeDestination(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, request.url);
  }

  return new URL("/onboarding", request.url);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const { publishableKey, url } = getSupabaseEnvironment();
  const response = NextResponse.redirect(getSafeDestination(request), 303);
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error("Missing authentication parameters") };

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", request.url), 303);
  }

  return response;
}
