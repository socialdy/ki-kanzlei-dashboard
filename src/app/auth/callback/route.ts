import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a password recovery flow
      const { data: { session } } = await supabase.auth.getSession();
      // Supabase sets the aal claim — we check if the user came from a recovery link
      // by looking at the `next` param or the session's amr (auth method reference)
      if (next === "/login?recovery=true") {
        return NextResponse.redirect(`${origin}/login?recovery=true`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
