import path from "node:path";
import { defineConfig } from "vitest/config";

// Vitest no lee los `paths` de tsconfig.json: sin este alias, cualquier test
// que importe algo con "@/..." (o que importe un módulo que lo haga) falla.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
