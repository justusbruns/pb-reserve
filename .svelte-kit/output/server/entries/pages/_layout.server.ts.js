import { p as private_env } from "../../chunks/private.js";
import { e as error } from "../../chunks/index.js";
function load() {
  const requiredVars = ["MAPBOX_TOKEN", "API_TOKEN"];
  const missingVars = requiredVars.filter((varName) => !private_env[varName]);
  if (missingVars.length > 0) {
    throw error(500, `Missing required environment variables: ${missingVars.join(", ")}`);
  }
  return {
    mapboxToken: private_env.MAPBOX_TOKEN,
    PUBLIC_API_TOKEN: private_env.API_TOKEN
    // Make API token available to client
  };
}
export {
  load
};
//# sourceMappingURL=_layout.server.ts.js.map
