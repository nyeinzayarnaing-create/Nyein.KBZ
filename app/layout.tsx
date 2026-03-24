import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Men & Lady Voting",
  description: "Vote for your Men and Lady",
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
