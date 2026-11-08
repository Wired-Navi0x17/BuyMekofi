import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmLinkForm, FormSkeleton } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Confirm", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton fields={0} />}>
      <ConfirmLinkForm />
    </Suspense>
  );
}
