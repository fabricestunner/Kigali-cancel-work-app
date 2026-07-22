import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts and does not import the React
// plugin: Vitest resolves its own nested Vite (rollup-based), which conflicts
// at the type level with this project's Vite 8 (rolldown-based) when the
// React plugin is shared. This suite covers pure TypeScript utilities only
// and needs no JSX transform.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
