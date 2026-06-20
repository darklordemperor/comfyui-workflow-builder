import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], test: { include: ["web/src/**/*.test.tsx"], environment: "jsdom", setupFiles: ["./web/src/test-setup.ts"] } });
