import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // 컴포넌트 테스트의 JSX(automatic 런타임)와 "@/..." 경로 별칭 지원
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // 환경은 파일별 지정: 순수 로직은 node(기본), 컴포넌트는 // @vitest-environment jsdom
});
