async function handle({ event, resolve }) {
  console.log("Incoming request:", {
    method: event.request.method,
    url: event.url.pathname,
    headers: Object.fromEntries(event.request.headers)
  });
  if (event.url.pathname.startsWith("/api/")) {
    console.log("Handling API request:", event.url.pathname);
    const response = await resolve(event);
    console.log("API response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers)
    });
    if (!response.headers.has("content-type")) {
      response.headers.set("content-type", "application/json");
    }
    return response;
  }
  return await resolve(event);
}
export {
  handle
};
//# sourceMappingURL=hooks.server.js.map
