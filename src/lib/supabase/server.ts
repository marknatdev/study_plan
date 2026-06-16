import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

if (typeof global !== "undefined" && typeof global.crypto !== "object") {
  global.crypto = require("node:crypto").webcrypto;
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your_supabase_url_here") {
    // Return a minimal mock for build time
    const mockHandler = {
      get: (_target: unknown, prop: string) => {
        if (prop === "auth") {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            exchangeCodeForSession: async () => ({ error: { message: "Supabase not configured" } }),
          };
        }
        if (prop === "from") {
          return () => ({
            select: () => ({
              order: async () => ({ data: [], error: null }),
              eq: () => ({ single: async () => ({ data: null, error: null }) }),
              single: async () => ({ data: null, error: null }),
            }),
            insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
            update: () => ({ eq: async () => ({ error: null }) }),
            delete: () => ({ eq: async () => ({ error: null }) }),
          });
        }
        return () => {};
      },
    };
    return new Proxy({} as ReturnType<typeof createServerClient>, mockHandler);
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}
