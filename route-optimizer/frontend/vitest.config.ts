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
        "src/pages/**",
        "src/components/route-planner/**",
        "src/components/ChangePasswordModal.tsx",
        "src/components/DeleteSavedPlaceConfirmModal.tsx",
        "src/components/ProfileHeroMediaModals.tsx",
        "src/components/AppSidebar.tsx",
        "dist/**"
      ],
      thresholds: {
        lines: 85,
        branches: 85
      }
    }
  }
});
