import type { Metadata } from "next";
import { WebDataSettings } from "@/components/WebDataSettings";

export const metadata: Metadata = { title: "设置与隐私 | StillMind", description: "导出或清除此浏览器中的 StillMind 本机数据。" };

export default function SettingsPage() { return <WebDataSettings />; }
