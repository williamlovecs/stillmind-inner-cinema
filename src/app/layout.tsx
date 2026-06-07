import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StillMind: Inner Cinema",
  description:
    "A hackathon demo that turns inner noise into a third-person movie and guides users back to observer mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
