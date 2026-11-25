"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { getFriendlyAuthErrorMessage } from "@/lib/auth";
import { validateEmail, validateMinLength } from "@/lib/validations";
import { Building2, AlertCircle, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TopNav } from "@/components/shared/top-nav";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const completeSessionAndRedirect = async (idToken: string) => {
    let res: Response;
    try {
      res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (networkErr: unknown) {
      throw new Error("Unable to connect to authentication server. Please check your network connection.");
    }

    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // If the server returns HTML (e.g. 500 error page, 504 gateway timeout, or Vercel function crash)
        throw new Error(
          res.ok
            ? "Authentication server returned an unparseable response."
            : `Authentication failed (HTTP ${res.status}): Server configuration or environment variable issue.`
        );
      }
    }

    if (!res.ok) {
      throw new Error(data.error || `Failed to establish server session (HTTP ${res.status}).`);
    }

    // Force-refresh token so newly-synced custom claims (role=citizen) are live BEFORE navigation
    try {
      const currentUser = getClientAuth().currentUser;
      if (currentUser) await currentUser.getIdToken(true);
    } catch {
      // Non-critical — dashboard still renders via server session cookie
    }

    router.push(data.redirectTo || "/citizen/dashboard");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Form validations
    if (!formData.fullName.trim()) {
      setAuthError("Please provide your full legal name for verified citizen reporting.");
      return;
    }

    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) {
      setAuthError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    const passCheck = validateMinLength(formData.password, 6, "Password");
    if (!passCheck.isValid) {
      setAuthError(passCheck.error || "Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAuthError("Password and Confirm Password do not match.");
      return;
    }

    if (!formData.termsAccepted) {
      setAuthError("You must acknowledge the municipal data standards and terms of use.");
      return;
    }

    if (!isClientFirebaseConfigured) {
      setAuthError(
        "Live Firebase credentials are not yet configured in .env.local. Please add your Firebase project keys to register live."
      );
      return;
    }

    setIsLoading(true);

    try {
      const auth = getClientAuth();
      let user;
      try {
        // 1. Create account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );
        user = userCredential.user;
        // 2. Set Firebase Auth display name
        await updateProfile(user, { displayName: formData.fullName.trim() });
      } catch (createErr: unknown) {
        const code = (createErr as { code?: string })?.code;
        if (code === "auth/email-already-in-use") {
          // If the account was already created in Firebase Auth (e.g. from an earlier attempt
          // where session establishment failed), verify credentials by signing in to complete session.
          try {
            const signInCredential = await signInWithEmailAndPassword(
              auth,
              formData.email.trim(),
              formData.password
            );
            user = signInCredential.user;
            if (formData.fullName.trim() && !user.displayName) {
              await updateProfile(user, { displayName: formData.fullName.trim() });
            }
          } catch {
            // Password mismatch or belongs to another user
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }

      // 3. Establish server session via Admin SDK & set citizen claims
      const idToken = await user.getIdToken();
      await completeSessionAndRedirect(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      const message = (err as { message?: string })?.message;
      setAuthError(code ? getFriendlyAuthErrorMessage(code) : (message || "Failed to register account."));
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);

    if (!isClientFirebaseConfigured) {
      setAuthError(
        "Live Firebase credentials are not yet configured in .env.local. Please add your Firebase project keys to proceed."
      );
      return;
    }

    setIsLoading(true);

    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await completeSessionAndRedirect(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      const message = (err as { message?: string })?.message;
      setAuthError(code ? getFriendlyAuthErrorMessage(code) : (message || "Google registration failed."));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE]">
      <TopNav showAuthLinks={false} />

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              CivicTrack · Resident Registration
            </p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1B3A2E]">
              Citizen Account Registration
            </h1>
            <p className="text-xs text-[#77796F]">
              Register to report neighbourhood issues and track repair progress
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Create Citizen Profile</CardTitle>
                <CardDescription>
                  Your details are maintained securely under municipal records
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {authError && (
                  <div className="rounded-sm border border-[#E4C9C6] bg-[#F4E8E7] p-2.5 text-xs text-[#8B342E] flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{authError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Ananya Sharma"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="resident@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 text-xs text-[#74796F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          termsAccepted: e.target.checked,
                        })
                      }
                      className="mt-0.5 rounded border-[#E5E8DF] text-[#788568] focus:ring-[#788568]"
                      required
                    />
                    <span>
                      I agree to the CivicTrack Terms of Use and acknowledge that reports are verified against civic records.
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Register as Citizen"
                  )}
                </Button>

                {/* Google Sign-in */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#DDD9CE]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#FAF8F2] px-2 text-[#77796F]">
                      or register with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-normal"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google Authentication
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col space-y-2 border-t border-[#DDD9CE] pt-4 text-center">
                <div className="text-xs text-[#77796F]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[#1B3A2E] hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#74796F] hover:text-[#30352D]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Public Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
