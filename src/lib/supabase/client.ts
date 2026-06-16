import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your_supabase_url_here") {
    // Return a mock client during build / when not configured
    // This prevents build failures when env vars aren't set
    const mockHandler = {
      get: (_target: unknown, prop: string) => {
        if (prop === "auth") {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
            signUp: async () => ({ error: { message: "Supabase not configured" } }),
            signInWithOAuth: async () => ({ error: { message: "Supabase not configured" } }),
            signOut: async () => ({}),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        if (prop === "from") {
          return () => ({
            select: () => ({ order: async () => ({ data: [], error: null }), eq: () => ({ single: async () => ({ data: null, error: { message: "Supabase not configured" } }) }), single: async () => ({ data: null, error: null }) }),
            insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: "Supabase not configured" } }) }) }),
            update: () => ({ eq: async () => ({ error: null }) }),
            delete: () => ({ eq: async () => ({ error: null }) }),
          });
        }
        return () => {};
      },
    };
    return new Proxy({} as ReturnType<typeof createBrowserClient>, mockHandler);
  }

  return createBrowserClient(url, key);
}
