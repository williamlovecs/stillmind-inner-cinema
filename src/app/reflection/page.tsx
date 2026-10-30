import type { Metadata } from "next";
import { WebReflection } from "@/components/WebReflection";

export const metadata: Metadata = { title: "本机复盘 | StillMind", description: "只根据此浏览器中的真实练习记录查看本周回顾。" };

export default function ReflectionPage() { return <WebReflection />; }
