"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import Link from "next/link";
import { PokerVisuals } from "@/components/auth/PokerVisuals";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        setSubmitError(error.message);
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        // Wait briefly for cookies to be set by the browser client
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Verify the session is actually set
        const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser();
        
        if (verifyError) {
          setSubmitError("Session could not be established. Please try again.");
          setLoading(false);
          return;
        }
        
        if (verifiedUser) {
          setSubmitError(null);
          setSuccessMessage("Login successful! Redirecting...");
          setLoading(false);
          // Redirect to home
          window.location.href = "/home";
        } else {
          setSubmitError("Session could not be established. Please try again.");
          setLoading(false);
        }
      } else {
        setSubmitError("Login failed. Please check your credentials.");
        setLoading(false);
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Poker visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <PokerVisuals />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 px-8 mt-80">
            <div className="text-6xl mb-4 text-pop-up">🃏</div>
            <h2 className="text-4xl font-bold text-white drop-shadow-lg text-pop-up-delay-1">
              Welcome Back
            </h2>
            <p className="text-xl text-green-100 drop-shadow-md text-pop-up-delay-2">
              Time to play your hand
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-background min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center space-y-2">
            <div className="text-4xl mb-2 text-pop-up">🃏</div>
            <h1 className="text-3xl font-bold text-foreground text-pop-up-delay-1">powkie</h1>
            <p className="text-muted-foreground text-pop-up-delay-2">Log in to continue</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block space-y-2">
            <h1 className="text-4xl font-bold text-foreground text-pop-up">
              Log in to powkie
            </h1>
            <p className="text-muted-foreground text-pop-up-delay-1">
              Enter your credentials to join the game
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange("email")}
                aria-invalid={!!errors.email}
                className="h-12"
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange("password")}
                aria-invalid={!!errors.password}
                className="h-12"
              />
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </Field>

            {submitError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                {submitError}
              </div>
            )}

            {successMessage && (
              <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                {successMessage}
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Deal Me In"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-semibold underline underline-offset-4">
                Sign up
              </Link>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>♠</span>
              <span>♥</span>
              <span>♦</span>
              <span>♣</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
