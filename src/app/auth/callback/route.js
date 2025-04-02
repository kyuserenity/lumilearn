import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${origin}/auth/error`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("Unexpected error during callback:", err);
      return NextResponse.redirect(`${origin}/auth/error`);
    }
  }

  console.error("No code provided in callback URL.");
  return NextResponse.redirect(`${origin}/auth/error`);
}
