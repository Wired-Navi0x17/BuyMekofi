import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm, FormSkeleton } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Set a new password" };

export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
