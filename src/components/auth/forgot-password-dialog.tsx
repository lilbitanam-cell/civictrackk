"use client";

import * as React from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { getFriendlyAuthErrorMessage } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = "",
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = React.useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setSuccess(false);
      setError(null);
    }
  }, [open, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!isClientFirebaseConfigured) {
      setError(
        "Firebase credentials are not configured in .env.local. Live password reset requires active Firebase Auth."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const auth = getClientAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getFriendlyAuthErrorMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reset Account Password</DialogTitle>
            <DialogDescription>
              Enter your registered citizen or municipal email to receive official password reset instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {success ? (
              <div className="rounded-sm border border-[#DDD9CE] bg-[#ECE9DF] p-3.5 text-xs text-[#263D30] flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#1B3A2E] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Instructions Sent</p>
                  <p className="mt-0.5 text-[#77796F]">
                    If an account is associated with <span className="font-medium text-[#252820]">{email}</span>, a secure password reset link has been dispatched to your inbox.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-sm border border-[#E5C9C6] bg-[#FAF0EE] p-2.5 text-xs text-[#8B342E] flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.gov or citizen@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {success ? "Close" : "Cancel"}
            </Button>
            {!success && (
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Sending Link..." : "Send Reset Link"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
