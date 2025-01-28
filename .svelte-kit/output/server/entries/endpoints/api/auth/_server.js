import { j as json } from "../../../../chunks/index.js";
import { p as private_env } from "../../../../chunks/private.js";
async function GET() {
  return json({ token: private_env.API_TOKEN });
}
export {
  GET
};
//# sourceMappingURL=_server.js.map
