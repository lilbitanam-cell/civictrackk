import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { TopNav } from "@/components/shared/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UnauthorizedPage(props: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await props.searchParams;

  let reasonMessage =
    "You do not possess the required departmental permissions to access this municipal workspace.";

  if (reason === "inactive") {
    reasonMessage =
      "Your account has been deactivated by the municipal administration. Please contact the helpdesk.";
  } else if (reason === "admin_required") {
    reasonMessage =
      "This section is restricted to authorized municipal supervisors and system administrators.";
  } else if (reason === "worker_required") {
    reasonMessage =
      "This work order queue is reserved for verified municipal field technicians.";
  } else if (reason === "citizen_required") {
    reasonMessage =
      "This portal is designated for registered citizens and resident reporting.";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE]">
      <TopNav showAuthLinks={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader className="text-center pb-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-[#F4E8E7] text-[#8B342E] mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-[#1B3A2E]">
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-center text-xs text-[#77796F]">
              <p className="leading-relaxed">{reasonMessage}</p>
              <div className="rounded-sm bg-[#ECE9DF] p-3 text-[11px] text-[#252820] text-left border border-[#DDD9CE]">
                <p className="font-semibold mb-1">Municipal Security Policy</p>
                <p className="text-[#77796F]">
                  Access permissions are governed by role-based credentials.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-4">
              <Button asChild className="w-full" size="sm">
                <Link href="/login">
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Sign In with Authorized Account
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Return to CivicTrack Home
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
