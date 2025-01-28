import "./index.js";
import { p as private_env } from "./private.js";
async function requireAuth(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing or invalid" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    const token = authHeader.split(" ")[1];
    if (token !== private_env.API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    return null;
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
export {
  requireAuth as r
};
//# sourceMappingURL=auth.js.map
