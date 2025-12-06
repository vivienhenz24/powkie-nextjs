"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  // @supabase/ssr automatically handles cookies in the browser
  // No need to manually configure cookie handlers
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    // Return a client anyway - it will fail gracefully with proper error handling
  }

  return createBrowserClient(
    supabaseUrl || "",
    supabaseAnonKey || ""
  );
}

