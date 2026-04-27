"use client";

import ProfileForm from "@/components/profile/ProfileForm";
import EmailChangeForm from "@/components/profile/EmailChangeForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto mt-8 mb-12 space-y-8">
      <h1 className="text-2xl font-bold">プロフィール</h1>

      <ProfileForm />

      <hr />

      <EmailChangeForm />

      <hr />

      <PasswordChangeForm />
    </div>
  );
}