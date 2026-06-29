import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StillMind",
  description:
    "12 种沉寂小我方法，在反应之前多一个观察位置。",
  applicationName: "StillMind",
  keywords: ["沉寂小我", "情绪觉察", "观电影法", "观察者模式", "正念", "StillMind"],
  openGraph: {
    title: "StillMind",
    description: "12 种沉寂小我方法，在反应之前多一个观察位置。",
    type: "website",
    locale: "zh_CN",
  },
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
