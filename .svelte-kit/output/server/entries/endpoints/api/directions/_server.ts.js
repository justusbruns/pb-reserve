import { M as MAPBOX_TOKEN } from "../../../../chunks/private.js";
import { j as json } from "../../../../chunks/index.js";
const GET = async ({ url }) => {
  const origin = url.searchParams.get("origin");
  const destination = url.searchParams.get("destination");
  if (!origin || !destination) {
    return new Response("Origin and destination parameters are required", { status: 400 });
  }
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=polyline&access_token=${MAPBOX_TOKEN}`
    );
    if (!response.ok) {
      throw new Error(`Directions request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Directions service error:", error);
    return new Response("Directions service error", { status: 500 });
  }
};
export {
  GET
};
//# sourceMappingURL=_server.ts.js.map
