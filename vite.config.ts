// @lovable.dev/vite-tanstack-config wraps tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, env injection, dedupe and the (optional) Cloudflare adapter.
// We disable the Cloudflare adapter so the build produces a plain Vite SSR
// output (dist/client/ + dist/server/server.js) suitable for Vercel.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({ cloudflare: false });
