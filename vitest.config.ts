import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // 컴포넌트 테스트(.tsx)의 JSX는 vitest 4의 기본 변환(oxc, automatic 런타임)이 처리한다
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // 환경은 파일별 지정: 순수 로직은 node(기본), 컴포넌트는 // @vitest-environment jsdom
});
