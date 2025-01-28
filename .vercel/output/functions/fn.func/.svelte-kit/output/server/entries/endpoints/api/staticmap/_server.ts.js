import { p as private_env } from "../../../../chunks/private.js";
import "../../../../chunks/index.js";
const GET = async ({ url }) => {
  const origin = url.searchParams.get("origin");
  const destination = url.searchParams.get("destination");
  const bbox = url.searchParams.get("bbox");
  const geojson = url.searchParams.get("geojson");
  console.log("Static map request params:", { origin, destination, bbox, geojson });
  if (!origin || !destination || !bbox || !geojson) {
    return new Response("Missing required parameters", { status: 400 });
  }
  if (!private_env.MAPBOX_TOKEN) {
    console.error("Mapbox token not found in environment");
    return new Response("Mapbox token not configured", { status: 500 });
  }
  try {
    const [originLng, originLat] = origin.split(",").map(Number);
    const [destLng, destLat] = destination.split(",").map(Number);
    const [west, south, east, north] = bbox.split(",").map(Number);
    const parsedGeojson = JSON.parse(geojson);
    const overlay = {
      type: "Feature",
      properties: {
        "stroke": "#326334",
        "stroke-width": 6,
        "stroke-opacity": 1
      },
      geometry: parsedGeojson
    };
    const mapUrl = new URL("https://api.mapbox.com/styles/v1/mapbox/light-v11/static");
    const encodedGeoJson = encodeURIComponent(JSON.stringify(overlay));
    mapUrl.pathname += `/geojson(${encodedGeoJson})`;
    mapUrl.pathname += `,pin-s-warehouse+326334(${originLng},${originLat})`;
    mapUrl.pathname += `,pin-s-car+326334(${destLng},${destLat})`;
    mapUrl.pathname += `/[${bbox}]`;
    mapUrl.pathname += "/800x600@2x";
    mapUrl.searchParams.append("access_token", private_env.MAPBOX_TOKEN);
    console.log("Requesting Mapbox static map...");
    const response = await fetch(mapUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mapbox API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Static map request failed: ${response.status} ${response.statusText}`);
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
    return new Response(`Static map service error: ${error.message}`, { status: 500 });
  }
};
export {
  GET
};
//# sourceMappingURL=_server.ts.js.map
