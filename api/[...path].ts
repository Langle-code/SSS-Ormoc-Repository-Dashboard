// Pre-built self-contained bundle (esbuild output) — all workspace deps inlined.
// Built by: pnpm --filter @workspace/api-server run build  →  api/_server/app.mjs
// @ts-ignore
import app from "./_server/app.mjs";

export default app;
