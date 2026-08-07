import { defineConfig } from "vitest/config";
import path from "node:path";
import os from "node:os";

// Never touch the live `.data/prediction-history.json` while unit tests run.
process.env.PREDICTION_HISTORY_DIR = path.join(
  os.tmpdir(),
  `polymarket-edge-vitest-${process.pid}`,
);

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.ts", "tests/integration/**/*.{test,spec}.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
