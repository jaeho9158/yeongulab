import type { NextConfig } from "next";

// 기본 보안 헤더 — AdSense/GA가 깨지지 않도록 CSP는 두지 않는다.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // 2026-09-09 새 도메인(yeonguhallab.kr)으로 이전한 뒤, 옛 Vercel 기본 도메인이
  // canonical 태그만 새 도메인을 가리킨 채 계속 살아 있었다(중복 노출).
  // 구글이 도메인 이전 신호를 canonical만으로는 느리게 받아들이므로 진짜
  // 301(영구 리다이렉트)을 건다. 프로덕션에 고정으로 붙는 Vercel 별칭만 정확히
  // 매칭해 배포별 해시 URL(미리보기 확인용)은 건드리지 않는다.
  async redirects() {
    return [
      "yeongulab.vercel.app",
      "yeongulab-jaeho9158-1738s-projects.vercel.app",
      "yeongulab-git-main-jaeho9158-1738s-projects.vercel.app",
    ].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://www.yeonguhallab.kr/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
