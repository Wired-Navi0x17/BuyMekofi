import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm, FormSkeleton } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create your page" };

export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <RegisterForm />
    </Suspense>
  );
}
