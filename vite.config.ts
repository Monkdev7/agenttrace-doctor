import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite + React. Vitest reads this same config, so tests run in the jsdom
// environment with the same module resolution as the app.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
