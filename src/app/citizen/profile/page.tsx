"use client";

import { useState, useEffect, useRef } from "react";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { uploadImageWithFallback } from "@/lib/firebase/storage";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/services/users.service";
import DashboardLayout from "@/components/citizen/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CitizenProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isClientFirebaseConfigured) return;
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      setDisplayName(u.displayName || "");
      setAvatarUrl(u.photoURL || "");
      try {
        const profile = await getUserProfile(u.uid);
        if (profile?.phone) setPhone(profile.phone);
      } catch {}
    });
    return () => unsub();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setBusy(true);
    setMsg(null);
    try {
      const url = await uploadImageWithFallback(file, "profilePhotos");
      setAvatarUrl(url);
    } catch (err: unknown) {
      setMsg({ type: "error", text: "Avatar upload failed: " + (err instanceof Error ? err.message : "Unknown error") });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      const resolvedPhoto = avatarUrl
        ? avatarUrl.startsWith("/")
          ? `${window.location.origin}${avatarUrl}`
          : avatarUrl
        : undefined;
      await updateProfile(user, { displayName, photoURL: resolvedPhoto });
      await updateUserProfile(user.uid, { displayName, phone, avatarUrl });
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
            Resident Account
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">
            Citizen Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#77796F] mt-1">
            Manage your registered contact details and communication preferences.
          </p>
        </div>

        {msg && (
          <div
            className={`text-xs sm:text-sm px-4 py-3 rounded-sm flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-[#ECE9DF] text-[#1B3A2E] border border-[#718267]"
                : "bg-[#FAF0EE] text-[#8B342E] border border-[#E5C9C6]"
            }`}
          >
            <span>{msg.text}</span>
          </div>
        )}

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-6">
          {/* Identity & Avatar */}
          <div className="flex items-center gap-4 pb-5 border-b border-[#DDD9CE]">
            <div className="w-16 h-16 rounded-full bg-[#ECE9DF] overflow-hidden border border-[#DDD9CE] shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#1B3A2E] text-xl font-serif font-semibold">
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "C"}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-serif text-base font-medium text-[#252820]">
                {displayName || user?.email || "Citizen"}
              </p>
              <p className="text-xs text-[#77796F]">
                Verified Citizen Account
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#DDD9CE] text-[#252820] hover:bg-[#ECE9DF] h-7 mt-1"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                {busy ? "Uploading..." : "Change Photograph"}
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#77796F]">
                Registered Email (Official ID)
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="border-[#DDD9CE] bg-[#ECE9DF]/60 text-xs sm:text-sm text-[#77796F]"
              />
              <p className="text-[11px] text-[#77796F]">
                Primary login identifier. Contact municipal support to request an email update.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium text-[#252820]">
                Full Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full legal name"
                className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-[#252820]">
                Contact Mobile Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
                type="tel"
                placeholder="+91 98765 43210"
              />
              <p className="text-[11px] text-[#77796F]">
                Used by municipal field teams to verify location details if required.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] w-full text-xs sm:text-sm font-medium h-10"
              disabled={busy}
              onClick={handleSave}
            >
              {busy ? "Saving Profile..." : "Save Profile Changes"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
