import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm, FormSkeleton } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton fields={1} />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
