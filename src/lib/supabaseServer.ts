import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const get = (name: string) => (cookieStore as any)?.get?.(name)?.value;
  const set = (name: string, value: string, options: any) => {
    (cookieStore as any)?.set?.({ name, value, ...options });
  };
  const remove = (name: string, options: any) => {
    (cookieStore as any)?.set?.({ name, value: "", ...options });
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get,
        set,
        remove,
      },
    }
  );
}
