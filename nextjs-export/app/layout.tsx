import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POgrid.id — PO Tracking Pabrikasi",
  description: "Sistem pelacakan PO untuk SME pabrikasi Indonesia. Operator, QC, Delivery, Admin — semua dalam satu aplikasi.",
  authors: [{ name: "POgrid.id" }],
  openGraph: {
    title: "POgrid.id — PO Tracking Pabrikasi",
    description: "Sistem pelacakan PO untuk SME pabrikasi Indonesia.",
    type: "website",
  },
  twitter: { card: "summary", site: "@Lovable" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
