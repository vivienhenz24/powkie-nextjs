import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { LoginForm } from "@/components/login/LoginForm";

/**
 * Login Page
 * 
 * If user is already authenticated, redirect them to home.
 * Otherwise, show the login form.
 */
export default async function LoginPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If user is already logged in (and there's no error), redirect to home
    // This prevents logged-in users from seeing the login page
    if (user && !error) {
      redirect("/home");
    }

    // User is not logged in or there was an error - show login form
    return <LoginForm />;
  } catch (error) {
    // If there's an unexpected error checking auth, show login form anyway
    // (better to allow login attempt than block it)
    return <LoginForm />;
  }
}


