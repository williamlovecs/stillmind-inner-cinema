import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StillMind: Inner Cinema",
  description:
    "把情绪触发转成三幕内在电影，在回应之前退回观察者位置。",
  applicationName: "StillMind",
  keywords: ["情绪觉察", "内在电影", "观察者模式", "正念", "StillMind"],
  openGraph: {
    title: "StillMind: Inner Cinema",
    description: "把脑子里的剧情，变成一场可以退出的电影。",
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
