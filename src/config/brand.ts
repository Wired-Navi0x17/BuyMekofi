/**
 * Single source for the product name and public domain.
 * "Eme Coffea et Thea" (Latin botanical names: coffee and tea) is a working name pending trademark clearance (PRD.md D1);
 * renaming the product should only require editing this file.
 */
export const brand = {
  name: "Eme Coffea et Thea",
  domain: "emecoffeaetthea.in", // PRD.md D12: not yet registered or confirmed
  tagline: "A page for your work, and a way to be paid for it.",
} as const;

export function profileUrlFor(username: string): string {
  return `${brand.domain}/${username}`;
}
