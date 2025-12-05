import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * App Layout - Allows both authenticated and guest access
 * 
 * This layout allows users to view the app in guest mode.
 * Authentication is handled client-side for features that require it.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access to the page for both authenticated and guest users
  // Guest users can preview the map and games, but will be prompted to login
  // when trying to interact with games
  return <>{children}</>;
}

