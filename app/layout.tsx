import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura & Edge Salon Booking",
  description: "A local demo booking system for a unisex salon."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
