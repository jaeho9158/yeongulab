import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "연구랩 가이드 — 청소년 연구 로드맵",
    template: "%s | 연구랩 가이드",
  },
  description:
    "청소년이 연구 주제 선정부터 논문 투고까지 6단계로 따라갈 수 있는 무료 가이드.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
