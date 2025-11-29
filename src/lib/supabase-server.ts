import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for server-side use (Server Components, Server Actions, etc.)
 * 
 * WHAT ARE COOKIES AND WHY DO WE NEED TO READ THEM?
 * 
 * 1. **What are cookies?**
 *    - Cookies are small pieces of data stored in your browser
 *    - When you log in, Supabase stores your authentication tokens in cookies
 *    - Every time your browser makes a request to our server, it automatically sends these cookies
 * 
 * 2. **Why read them server-side?**
 *    - When a user visits a protected page (like /home), we need to check if they're logged in
 *    - We do this by reading the cookies that contain their session tokens
 *    - If the cookies are valid, we know who they are and allow access
 *    - If there are no cookies or they're invalid, we redirect to login
 * 
 * 3. **How it works:**
 *    - User logs in → Supabase sets cookies in browser
 *    - User visits /home → Browser sends cookies with the request
 *    - This function reads those cookies → Verifies the user is authenticated
 *    - If valid → Show the page, if not → Redirect to login
 * 
 * NOTE: In Next.js 16, cookies() returns a Promise and must be awaited!
 */
export async function createSupabaseServerClient() {
  // In Next.js 16, cookies() returns a Promise - we must await it
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            // In Next.js 16, the cookieStore (after awaiting cookies()) should have a getAll() method
            if (typeof cookieStore.getAll === "function") {
              const allCookies = cookieStore.getAll();
              // cookieStore.getAll() returns an array of { name, value } objects
              // which is exactly what Supabase expects
              return allCookies;
            }
            
            // Fallback: If getAll() doesn't exist (shouldn't happen in Next.js 16)
            // Return empty array - middleware will handle session refresh
            return [];
          } catch (error) {
            // Only log actual errors, not expected cases
            console.error("[Server] Error reading cookies:", error);
            return [];
          }
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              // Set cookies using the cookieStore API
              cookieStore.set(name, value, options);
            } catch {
              // The `set` method was called from a Server Component.
              // Server Components can't set cookies directly - that's why we have middleware
              // to handle cookie setting. This is expected and safe to ignore.
            }
          });
        },
      },
    }
  );
}

