import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura & Edge Salon Booking",
  description: "Your next salon visit, thoughtfully arranged. Book cuts, styling and hair care at Aura & Edge."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('salon-theme')==='dark'?'dark':'light'}catch{}` }} />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
