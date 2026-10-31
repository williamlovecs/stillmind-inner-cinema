import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function AppHeader({ current, action }: { current?: string; action?: ReactNode }) {
  return <header className="sm-header">
    <Link href="/" className="sm-brand" aria-label="StillMind 首页">
      <span className="sm-brand-mark" aria-hidden="true" />
      <span><span className="sm-brand-name">StillMind</span><span className="sm-brand-description">{current ?? "沉寂小我"}</span></span>
    </Link>
    {action ?? <Link href="/methods" className="sm-button sm-button-quiet">方法库</Link>}
  </header>;
}

export function Surface({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`sm-surface ${className}`} {...props}>{children}</section>;
}

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "quiet" | "warm" };
export function ActionButton({ tone = "quiet", className = "", type = "button", ...props }: ActionProps) {
  return <button type={type} className={`sm-button sm-button-${tone} ${className}`} {...props} />;
}

export function ChoiceButton({ selected, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return <button type={type} aria-pressed={selected} className={`sm-choice ${selected ? "is-selected" : ""} ${className}`} {...props} />;
}
