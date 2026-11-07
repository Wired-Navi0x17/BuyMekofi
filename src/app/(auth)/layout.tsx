import { SplitShell } from "@/components/auth/split-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <SplitShell>{children}</SplitShell>;
}
