import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        "src/domain/**",
        "src/pages/AuthFlowPage.tsx",
        "src/pages/ProfilePage.tsx",
        "src/pages/RouteHistoryPage.tsx",
        "src/pages/RouteOptimizerPage.tsx",
        "dist/**"
      ],
      thresholds: {
        lines: 85,
        branches: 85
      }
    }
  }
});
