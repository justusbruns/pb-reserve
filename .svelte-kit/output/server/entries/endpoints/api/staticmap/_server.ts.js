import { M as MAPBOX_TOKEN } from "../../../../chunks/private.js";
import "../../../../chunks/index.js";
const GET = async ({ url }) => {
  const origin = url.searchParams.get("origin");
  const destination = url.searchParams.get("destination");
  const bbox = url.searchParams.get("bbox");
  const geojson = url.searchParams.get("geojson");
  if (!origin || !destination || !bbox || !geojson) {
    return new Response("Missing required parameters", { status: 400 });
  }
  try {
    const [originLng, originLat] = origin.split(",");
    const [destLng, destLat] = destination.split(",");
    const timestamp = Date.now();
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/geojson(${geojson}),pin-s-warehouse+326334(${originLng},${originLat}),pin-s-car+326334(${destLng},${destLat})/[${bbox}]/500x400@2x?access_token=${MAPBOX_TOKEN}&style_filter=[{"id":"background","color":"#F0F9D5"},{"id":"water","color":"#C9DA9A"},{"id":"road","color":"#326334"},{"id":"road-secondary-tertiary","color":"#326334"},{"id":"road-primary","color":"#326334"}]&t=${timestamp}`;
    const response = await fetch(mapUrl);
    if (!response.ok) {
      throw new Error(`Static map request failed: ${response.statusText}`);
    }
    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    console.error("Static map service error:", error);
    return new Response("Static map service error", { status: 500 });
  }
};
export {
  GET
};
//# sourceMappingURL=_server.ts.js.map
