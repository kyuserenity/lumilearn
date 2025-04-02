import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export const cookies = {
  async get(name) {
    const cookieStore = await nextCookies();
    return cookieStore.get(name)?.value;
  },
  set(name, value, options) {
    const cookieStore = nextCookies();
    cookieStore.set({ name, value, ...options });
  },
  remove(name, options) {
    const cookieStore = nextCookies();
    cookieStore.set({ name, value: "", ...options });
  },
};

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies,
    },
  );
}
