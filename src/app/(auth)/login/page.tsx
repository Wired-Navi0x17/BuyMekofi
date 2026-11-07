import type { Metadata } from "next";
import { NotOpenYet } from "../not-open";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <NotOpenYet title="Log in" />;
}
