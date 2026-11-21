"use client";

import { useState, useEffect, useRef } from "react";
import { getClientAuth, getClientStorage } from "@/lib/firebase/config";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#30352D]">Citizen Profile</h1>
          <p className="text-xs sm:text-sm text-[#74796F] mt-1">
            Manage your registered contact details and communication preferences.
          </p>
        </div>

        {msg && (
          <div
            className={`text-xs sm:text-sm px-4 py-3 rounded-md flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            <span>{msg.text}</span>
          </div>
        )}

        <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-6">
          {/* Identity & Avatar */}
          <div className="flex items-center gap-4 pb-5 border-b border-[#F1F3EC]">
            <div className="w-16 h-16 rounded-full bg-[#E9EDE4] overflow-hidden border border-[#D8DDD1] shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#536247] text-xl font-bold">
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "C"}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#30352D]">
                {displayName || user?.email || "Citizen"}
              </p>
              <p className="text-xs text-[#74796F]">
                Verified Citizen Account
              </p>
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
                className="text-xs border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC] h-7 mt-1"
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
              <Label className="text-xs font-medium text-[#74796F]">
                Registered Email (Official ID)
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="border-[#E5E8DF] bg-[#F8F9F5] text-xs sm:text-sm text-[#74796F]"
              />
              <p className="text-[11px] text-[#74796F]">
                Primary login identifier. Contact municipal support to request an email update.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium text-[#30352D]">
                Full Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full legal name"
                className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-[#30352D]">
                Contact Mobile Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                type="tel"
                placeholder="+91 98765 43210"
              />
              <p className="text-[11px] text-[#74796F]">
                Used by municipal field teams to verify location details if required.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              className="bg-[#788568] hover:bg-[#536247] text-white w-full text-xs sm:text-sm font-semibold h-10"
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
