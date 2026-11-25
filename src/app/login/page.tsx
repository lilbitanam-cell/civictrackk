"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { getFriendlyAuthErrorMessage } from "@/lib/auth";
import { Building2, AlertCircle, ArrowLeft, Shield, Wrench, User, Loader2 } from "lucide-react";
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
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [showForgotDialog, setShowForgotDialog] = React.useState(false);

  // Handle establish session on server and redirect
  const completeSessionAndRedirect = async (idToken: string) => {
    let res: Response;
    try {
      res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch {
      throw new Error("Unable to connect to authentication server. Please check your network connection.");
    }

    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.ok
            ? "Authentication server returned an unparseable response."
            : `Authentication failed (HTTP ${res.status}): Server configuration issue.`
        );
      }
    }

    if (!res.ok) {
      throw new Error(data.error || `Failed to establish server session (HTTP ${res.status}).`);
    }

    // Force-refresh token so the latest custom claims (role) are embedded
    // before any client-side Firestore requests run on the dashboard.
    try {
      const { getClientAuth } = await import("@/lib/firebase/config");
      const currentUser = getClientAuth().currentUser;
      if (currentUser) await currentUser.getIdToken(true);
    } catch {
      // Non-critical — dashboard will still load with server session cookie
    }

    router.push(data.redirectTo || "/citizen/dashboard");
    router.refresh();
  };

  // 1. Email & Password Sign In
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError("Please enter both email address and password.");
      return;
    }

    if (!isClientFirebaseConfigured) {
      setAuthError(
        "Live Firebase credentials are not configured in .env.local. You can use the Quick Role Testing buttons below to test all three roles."
      );
      return;
    }

    setIsLoading(true);

    try {
      const auth = getClientAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();
      await completeSessionAndRedirect(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      const message = (err as { message?: string })?.message;
      setAuthError(code ? getFriendlyAuthErrorMessage(code) : (message || "Failed to sign in."));
      setIsLoading(false);
    }
  };

  // 2. Google Sign In
  const handleGoogleSignIn = async () => {
    setAuthError(null);

    if (!isClientFirebaseConfigured) {
      setAuthError(
        "Live Firebase credentials are not configured in .env.local. Use the Quick Role Testing buttons below."
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
      setAuthError(code ? getFriendlyAuthErrorMessage(code) : (message || "Google sign-in failed."));
      setIsLoading(false);
    }
  };

  // 3. Quick Role Test Handler (Development & Verification helper)
  const handleDevRoleLogin = async (role: UserRole) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Clear any stale Firebase Client Auth user so UIDs cannot mismatch the dev test session
      if (isClientFirebaseConfigured) {
        try {
          await signOut(getClientAuth());
        } catch {
          // Non-fatal
        }
      }

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devRole: role }),
      });

      const text = await res.text();
      let data: { error?: string; redirectTo?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            res.ok
              ? "Authentication server returned an invalid response."
              : `Failed to switch role (HTTP ${res.status}).`
          );
        }
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch role.");
      }

      router.push(data.redirectTo || "/citizen/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to establish test session.";
      setAuthError(msg);
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
              CivicTrack · Official Portal
            </p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1B3A2E]">
              Municipal Portal Access
            </h1>
            <p className="text-xs text-[#77796F]">
              Sign in with your registered account credentials
            </p>
          </div>

          <Card>
            <form onSubmit={handleEmailSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Account Sign In</CardTitle>
                <CardDescription>
                  Access your citizen or departmental workspace
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3.5">
                {authError && (
                  <div className="rounded-sm border border-[#E4C9C6] bg-[#F4E8E7] p-2.5 text-xs text-[#8B342E] flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.gov or citizen@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotDialog(true)}
                      className="text-[11px] text-[#1B3A2E] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Google Sign-in */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#DDD9CE]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#FAF8F2] px-2 text-[#77796F]">
                      or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-normal"
                  onClick={handleGoogleSignIn}
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

              <CardFooter className="flex flex-col space-y-3 border-t border-[#DDD9CE] pt-4 text-center">
                <div className="text-xs text-[#77796F]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#1B3A2E] hover:underline"
                  >
                    Register as Citizen
                  </Link>
                </div>

                {/* Role Testing Bar (Development only) */}
                {process.env.NODE_ENV !== "production" && (
                <div className="rounded-md border border-[#E5E8DF] bg-[#F8F9F5] p-2.5 text-left w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#74796F]">
                      Role Testing Access
                    </span>
                    <span className="text-[9px] bg-[#E9EDE4] text-[#3E4B37] px-1.5 py-0.5 rounded font-medium">
                      Server Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDevRoleLogin("citizen")}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1 rounded border border-[#E5E8DF] bg-white px-2 py-1.5 text-[11px] font-medium text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
                    >
                      <User className="h-3 w-3 text-[#536247]" /> Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevRoleLogin("worker")}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1 rounded border border-[#E5E8DF] bg-white px-2 py-1.5 text-[11px] font-medium text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
                    >
                      <Wrench className="h-3 w-3 text-[#536247]" /> Worker
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevRoleLogin("admin")}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1 rounded border border-[#E5E8DF] bg-white px-2 py-1.5 text-[11px] font-medium text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
                    >
                      <Shield className="h-3 w-3 text-[#536247]" /> Admin
                    </button>
                  </div>
                </div>
                )}
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

      <ForgotPasswordDialog
        open={showForgotDialog}
        onOpenChange={setShowForgotDialog}
        defaultEmail={email}
      />
    </div>
  );
}
