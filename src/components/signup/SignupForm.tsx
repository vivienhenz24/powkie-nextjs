"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import Link from "next/link";
import { PokerVisuals } from "@/components/auth/PokerVisuals";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

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
  house: z.enum(HARVARD_HOUSES, "Please select your Harvard house"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type SignupFormState = Omit<SignupFormData, "house"> & { house: SignupFormData["house"] | "" };

export function SignupForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [formData, setFormData] = useState<SignupFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    house: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailConfirmationMessage, setEmailConfirmationMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Type assertion is safe here - Zod will validate the actual value
    const result = signupSchema.safeParse(formData as unknown as SignupFormData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      // Sign up the user
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
        setSubmitError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Check if email confirmation is required
        // If user needs to confirm email, they won't have a session yet
        if (!authData.session) {
          // Email confirmation is required - show success message
          setSubmitError(null);
          setEmailConfirmationMessage(
            "Account created! Please check your email to confirm your account before logging in."
          );
          setLoading(false);
          return;
        }

        // User has a session (email confirmation disabled or already confirmed)
        // The profile is automatically created by the trigger we set up in Supabase
        // But we also explicitly create/update it here to ensure display_name is set
        await supabase.from("profiles").upsert({
          user_id: authData.user.id,
          display_name: `${result.data.firstName} ${result.data.lastName}`,
          bio: "",
        });

        // Wait briefly for cookies to be set, then redirect
        await new Promise((resolve) => setTimeout(resolve, 300));
        window.location.href = "/home";
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SignupFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [field as keyof SignupFormData]: undefined }));
    }
  };

  const handleSelectChange = (field: keyof SignupFormState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [field as keyof SignupFormData]: undefined }));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Poker visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <PokerVisuals />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 px-8 mt-80">
            <div className="text-6xl mb-4 text-pop-up">🎰</div>
            <h2 className="text-4xl font-bold text-white drop-shadow-lg text-pop-up-delay-1">
              Join the Game
            </h2>
            <p className="text-xl text-green-100 drop-shadow-md text-pop-up-delay-2">
              Your winning hand awaits
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-background min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center space-y-2">
            <div className="text-4xl mb-2 text-pop-up">🎰</div>
            <h1 className="text-3xl font-bold text-foreground text-pop-up-delay-1">powkie</h1>
            <p className="text-muted-foreground text-pop-up-delay-2">Create your account</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block space-y-2">
            <h1 className="text-4xl font-bold text-foreground text-pop-up">
              Sign up for powkie
            </h1>
            <p className="text-muted-foreground text-pop-up-delay-1">
              Create your account and start playing
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                aria-invalid={!!errors.firstName}
                className="h-12"
              />
              {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                aria-invalid={!!errors.lastName}
                className="h-12"
              />
              {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@college.harvard.edu"
                value={formData.email}
                onChange={handleChange("email")}
                aria-invalid={!!errors.email}
                className="h-12"
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.house}>
              <FieldLabel htmlFor="house">Harvard House</FieldLabel>
              <Select
                id="house"
                value={formData.house || ""}
                onChange={handleSelectChange("house")}
                aria-invalid={!!errors.house}
                className="h-12"
              >
                <option value="" disabled>
                  Select your house
                </option>
                {HARVARD_HOUSES.map((house) => (
                  <option key={house} value={house}>
                    {house}
                  </option>
                ))}
              </Select>
              {errors.house && <FieldError>{errors.house}</FieldError>}
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

            {emailConfirmationMessage && (
              <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                {emailConfirmationMessage}
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Join the Table"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold underline underline-offset-4">
                Log in
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
