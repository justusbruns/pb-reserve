import { j as json } from "../../../../chunks/index.js";
import { d as private_env } from "../../../../chunks/shared-server.js";
async function GET() {
  return json({ token: private_env.API_TOKEN });
}
export {
  GET
};
//# sourceMappingURL=_server.js.map
