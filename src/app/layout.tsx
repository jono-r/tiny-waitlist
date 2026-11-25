import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Factory template",
  description: "Golden starting point for a TypeScript micro-SaaS.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
