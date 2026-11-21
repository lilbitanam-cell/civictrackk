"use client";

import { useState, useEffect, useRef } from "react";
import { getClientAuth, getClientStorage } from "@/lib/firebase/config";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
    if (!file || !user) return;
    setBusy(true);
    try {
      const storageRef = ref(getClientStorage(), `profilePhotos/${user.uid}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setAvatarUrl(url);
    } catch (err: any) {
      setMsg({ type: "error", text: "Avatar upload failed: " + err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      await updateProfile(user, { displayName, photoURL: avatarUrl || undefined });
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
        <div>
          <h1 className="text-2xl font-semibold text-[#30352D]">Worker Profile</h1>
          <p className="text-sm text-[#74796F]">Manage your personnel details and contact information.</p>
        </div>

        {msg && (
          <div
            className={`text-sm px-4 py-3 rounded-md ${
              msg.type === "success"
                ? "bg-[#E9EDE4] text-[#3E4B37]"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="bg-white border border-[#E5E8DF] rounded-lg p-6 space-y-6 shadow-sm">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#E9EDE4] flex items-center justify-center overflow-hidden border border-[#B4BBA5] shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-[#788568]" />
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-[#E5E8DF] text-xs text-[#30352D]"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                Change Photo
              </Button>
              <p className="text-xs text-[#74796F] mt-1">JPG, PNG up to 2MB</p>
            </div>
          </div>

          {/* Department badge (read-only) */}
          <div className="p-3.5 bg-[#F8F9F5] rounded-md border border-[#E5E8DF] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-[#30352D]">
              <Building2 className="h-4 w-4 text-[#788568]" />
              <span className="font-medium">Department:</span>
              <span className="text-[#536247]">{profile?.departmentName || "Municipal Field Operations"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#788568] bg-[#E9EDE4] px-2 py-0.5 rounded">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Worker</span>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#74796F] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-[#F8F9F5] border-[#E5E8DF] text-sm text-[#74796F] cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#74796F] flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-[#E5E8DF] text-sm"
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#74796F] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Contact Phone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-[#E5E8DF] text-sm"
              placeholder="+91 98765 43210"
            />
          </div>

          <Button
            className="w-full bg-[#788568] hover:bg-[#536247] text-white text-sm"
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
