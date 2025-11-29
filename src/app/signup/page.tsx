import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SignupForm } from "@/components/signup/SignupForm";

/**
 * Signup Page
 * 
 * If user is already authenticated, redirect them to home.
 * Otherwise, show the signup form.
 */
export default async function SignupPage() {
  try {
    // Note: createSupabaseServerClient is now async and must be awaited
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is already logged in, redirect to home
    if (user) {
      redirect("/home");
    }

    // User is not logged in - show signup form
    return <SignupForm />;
  } catch (error) {
    // If there's an error checking auth, show signup form anyway
    // (better to allow signup attempt than block it)
    return <SignupForm />;
  }
}


