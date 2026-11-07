import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm, FormSkeleton } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <LoginForm />
    </Suspense>
  );
}
