import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beehive Tracking",
  description: "Track your apiaries, hives, and inspections",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
