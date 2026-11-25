"use client";

import { useState, useEffect, useRef } from "react";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { uploadImageWithFallback } from "@/lib/firebase/storage";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/services/users.service";
import WorkerLayout from "@/components/worker/WorkerLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserDocument } from "@/types";
import { User as UserIcon, Building2, Phone, Mail, ShieldCheck } from "lucide-react";

export default function WorkerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDocument | null>(null);
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
        const p = await getUserProfile(u.uid);
        if (p) {
          setProfile(p);
          if (p.phone) setPhone(p.phone);
          if (p.displayName) setDisplayName(p.displayName);
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
        }
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
      setMsg({ type: "error", text: "Failed to update profile: " + err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkerLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="border-b border-[#DDD9CE] pb-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#718267] font-medium">
            Personnel Record
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">Worker Profile</h1>
          <p className="text-sm text-[#77796F]">Manage your personnel details and contact information.</p>
        </div>

        {msg && (
          <div
            className={`text-sm px-4 py-3 rounded-sm ${
              msg.type === "success"
                ? "bg-[#ECE9DF] text-[#1B3A2E] border border-[#718267]"
                : "bg-[#FAF0EE] text-[#8B342E] border border-[#E5C9C6]"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#ECE9DF] flex items-center justify-center overflow-hidden border border-[#DDD9CE] shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-[#718267]" />
              )}
            </div>
            <div>
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
                className="border-[#DDD9CE] text-xs text-[#252820] hover:bg-[#ECE9DF]"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                Change Photo
              </Button>
              <p className="text-xs text-[#77796F] mt-1">JPG, PNG up to 2MB</p>
            </div>
          </div>

          {/* Department badge (read-only) */}
          <div className="p-3.5 bg-[#F7F5EE] rounded-sm border border-[#DDD9CE] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-[#252820]">
              <Building2 className="h-4 w-4 text-[#718267]" />
              <span className="font-medium">Department:</span>
              <span className="text-[#1B3A2E]">{profile?.departmentName || "Municipal Field Operations"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Worker</span>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#77796F] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-[#ECE9DF]/60 border-[#DDD9CE] text-sm text-[#77796F] cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#77796F] flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-[#DDD9CE] bg-[#F7F5EE] text-sm"
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#77796F] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Contact Phone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-[#DDD9CE] bg-[#F7F5EE] text-sm"
              placeholder="+91 98765 43210"
            />
          </div>

          <Button
            className="w-full bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] text-sm font-medium"
            disabled={busy}
            onClick={handleSave}
          >
            {busy ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </WorkerLayout>
  );
}
