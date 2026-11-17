/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["./tests/setup.ts"],
      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "tests/**/*.component.test.{ts,tsx}",
        "tests/garden/**/*.test.ts",
      ],
      exclude: ["tests/invariants/**", "node_modules/**", "dist/**"],
    },
  }),
)
