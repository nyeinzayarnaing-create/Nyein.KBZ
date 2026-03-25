import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stars of the Night",
  description: "Vote for your Stars of the Night candidates and groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#faf9f7] text-[#1a1a2e] font-sans">
        {children}
      </body>
    </html>
  );
}
