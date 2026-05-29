// @ts-ignore
import app from "../artifacts/api-server/dist/app.mjs";

export default function handler(req: any, res: any) {
  return app(req, res);
}
