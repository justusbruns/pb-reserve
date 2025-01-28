import { p as private_env } from "./private.js";
if (process.env.NODE_ENV === "development") {
  console.log("Server environment variables:", {
    AIRTABLE_BASE_ID: !!private_env.AIRTABLE_BASE_ID,
    AIRTABLE_PAT: !!private_env.AIRTABLE_PAT,
    MAPBOX_TOKEN: !!private_env.MAPBOX_TOKEN
  });
}
async function handle({ event, resolve }) {
  if (!private_env.AIRTABLE_PAT || !private_env.AIRTABLE_BASE_ID || !private_env.MAPBOX_TOKEN) {
    console.error("Missing required environment variables:", {
      AIRTABLE_PAT: !private_env.AIRTABLE_PAT,
      AIRTABLE_BASE_ID: !private_env.AIRTABLE_BASE_ID,
      MAPBOX_TOKEN: !private_env.MAPBOX_TOKEN
    });
    return new Response("Server configuration error", { status: 500 });
  }
  if (event.url.pathname.startsWith("/api/")) {
    console.log("API request:", {
      path: event.url.pathname,
      method: event.request.method,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  try {
    if (event.url.pathname.startsWith("/api/")) {
      const response = await resolve(event);
      console.log("API response:", {
        status: response.status,
        headers: Object.fromEntries(response.headers)
      });
      if (!response.headers.has("content-type") && !event.url.pathname.startsWith("/api/staticmap")) {
        response.headers.set("content-type", "application/json");
      }
      return response;
    }
    return await resolve(event);
  } catch (error) {
    console.error("Error in hooks.server.js:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
export {
  handle
};
//# sourceMappingURL=hooks.server.js.map
