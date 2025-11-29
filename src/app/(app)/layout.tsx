import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Protected Layout for authenticated routes
 * 
 * This layout checks if the user is authenticated before allowing access.
 * If not authenticated, it redirects to the login page.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create Supabase client and check if user is authenticated
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's an error getting the user OR no user is found, redirect to login
  // This ensures that only authenticated users can access protected routes
  // redirect() in Next.js throws internally to perform the redirect
  if (error || !user) {
    redirect("/login");
  }

  // User is authenticated - allow access to the page
  return <>{children}</>;
}

