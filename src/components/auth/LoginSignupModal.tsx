"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => email.endsWith("@college.harvard.edu"), {
      message: "Email must be a Harvard email address (@college.harvard.edu)",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  house: z.string().min(1, "Please select your Harvard house"),
});

const HARVARD_HOUSES = [
  "Adams House",
  "Cabot House",
  "Currier House",
  "Dunster House",
  "Eliot House",
  "Freshman",
  "Kirkland House",
  "Leverett House",
  "Lowell House",
  "Mather House",
  "Pforzheimer House",
  "Quincy House",
  "Winthrop House",
] as const;

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface LoginSignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginSignupModal({ open, onClose, onSuccess }: LoginSignupModalProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Login state
  const [loginData, setLoginData] = useState<LoginFormData>({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup state
  const [signupData, setSignupData] = useState<Omit<SignupFormData, "house"> & { house: string }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    house: "",
  });
  const [signupErrors, setSignupErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(loginData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        fieldErrors[field] = issue.message;
      });
      setLoginErrors(fieldErrors);
      return;
    }
    
    setLoginErrors({});
    setLoginError(null);
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        setLoginError(error.message);
        setLoginLoading(false);
        return;
      }

      if (data.user && data.session) {
        // Wait for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Verify session
        const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser();
        
        if (verifyError || !verifiedUser) {
          setLoginError("Session could not be established. Please try again.");
          setLoginLoading(false);
          return;
        }

        setLoginError(null);
        setLoginLoading(false);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        // Refresh the page to update UI
        window.location.reload();
      } else {
        setLoginError("Login failed. Please check your credentials.");
        setLoginLoading(false);
      }
    } catch (err) {
      setLoginError("An unexpected error occurred. Please try again.");
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(signupData as SignupFormData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupFormData;
        fieldErrors[field] = issue.message;
      });
      setSignupErrors(fieldErrors);
      return;
    }
    
    setSignupErrors({});
    setSignupError(null);
    setSignupLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            display_name: `${result.data.firstName} ${result.data.lastName}`,
            first_name: result.data.firstName,
            last_name: result.data.lastName,
            house: result.data.house,
          },
        },
      });

      if (authError) {
        setSignupError(authError.message);
        setSignupLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile
        await supabase.from("profiles").upsert({
          user_id: authData.user.id,
          display_name: `${result.data.firstName} ${result.data.lastName}`,
          contact_email: result.data.email,
        });

        // Check if email confirmation is required
        if (!authData.session) {
          setSignupSuccess(true);
          setSignupError(null);
          setSignupLoading(false);
          // Show success message for a bit, then switch to login
          setTimeout(() => {
            setSignupSuccess(false);
            setMode("login");
          }, 3000);
        } else {
          // User has a session - login successful
          setSignupLoading(false);
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          window.location.reload();
        }
      }
    } catch (err) {
      setSignupError("An unexpected error occurred. Please try again.");
      setSignupLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === "login" ? "Log In" : "Sign Up"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === "login" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Log in to view game details and join games.
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <Field data-invalid={!!loginErrors.email}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@college.harvard.edu"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    aria-invalid={!!loginErrors.email}
                  />
                  {loginErrors.email && <FieldError>{loginErrors.email}</FieldError>}
                </Field>

                <Field data-invalid={!!loginErrors.password}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    aria-invalid={!!loginErrors.password}
                  />
                  {loginErrors.password && <FieldError>{loginErrors.password}</FieldError>}
                </Field>

                {loginError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Logging in..." : "Log In"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setLoginError(null);
                    setLoginErrors({});
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Create an account to join and host games.
              </p>
              {signupSuccess && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2">
                  Account created! Please check your email to confirm your account.
                </div>
              )}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field data-invalid={!!signupErrors.firstName}>
                    <FieldLabel htmlFor="signup-firstName">First name</FieldLabel>
                    <Input
                      id="signup-firstName"
                      type="text"
                      placeholder="First name"
                      value={signupData.firstName}
                      onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                      aria-invalid={!!signupErrors.firstName}
                    />
                    {signupErrors.firstName && <FieldError>{signupErrors.firstName}</FieldError>}
                  </Field>

                  <Field data-invalid={!!signupErrors.lastName}>
                    <FieldLabel htmlFor="signup-lastName">Last name</FieldLabel>
                    <Input
                      id="signup-lastName"
                      type="text"
                      placeholder="Last name"
                      value={signupData.lastName}
                      onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                      aria-invalid={!!signupErrors.lastName}
                    />
                    {signupErrors.lastName && <FieldError>{signupErrors.lastName}</FieldError>}
                  </Field>
                </div>

                <Field data-invalid={!!signupErrors.email}>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@college.harvard.edu"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    aria-invalid={!!signupErrors.email}
                  />
                  {signupErrors.email && <FieldError>{signupErrors.email}</FieldError>}
                </Field>

                <Field data-invalid={!!signupErrors.password}>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    aria-invalid={!!signupErrors.password}
                  />
                  {signupErrors.password && <FieldError>{signupErrors.password}</FieldError>}
                </Field>

                <Field data-invalid={!!signupErrors.house}>
                  <FieldLabel htmlFor="signup-house">Harvard House</FieldLabel>
                  <select
                    id="signup-house"
                    value={signupData.house}
                    onChange={(e) => setSignupData({ ...signupData, house: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select your house</option>
                    {HARVARD_HOUSES.map((house) => (
                      <option key={house} value={house}>
                        {house}
                      </option>
                    ))}
                  </select>
                  {signupErrors.house && <FieldError>{signupErrors.house}</FieldError>}
                </Field>

                {signupError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
                    {signupError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupLoading}
                >
                  {signupLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setSignupError(null);
                    setSignupErrors({});
                    setSignupSuccess(false);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Log in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

