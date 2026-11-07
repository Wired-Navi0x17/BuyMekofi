import type { Metadata } from "next";
import { NotOpenYet } from "../not-open";

export const metadata: Metadata = { title: "Create your page" };

export default function RegisterPage() {
  return <NotOpenYet title="Create your page" />;
}
