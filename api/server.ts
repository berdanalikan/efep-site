// Vercel serverless entry. Wraps the TanStack Start SSR fetch handler
// produced by `vite build` (dist/server/server.js) so all non-static
// requests are handled by the Start router on Vercel's Node.js runtime.
//
// `dist/server/server.js` is generated during the build step and exists
// when Vercel bundles this function. The `// @ts-ignore` keeps tsc happy
// before the build artifact exists locally.

// @ts-ignore - generated at build time
import server from "../dist/server/server.js";

export const config = { runtime: "nodejs" };

export default function handler(request: Request): Promise<Response> {
  return (server as { fetch: (req: Request) => Promise<Response> }).fetch(request);
}
