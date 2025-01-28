import { j as json } from "../../../../chunks/index.js";
import { d as private_env } from "../../../../chunks/shared-server.js";
async function GET({ url }) {
  console.log("Geocoding API called with params:", Object.fromEntries(url.searchParams));
  const address = url.searchParams.get("address");
  const language = url.searchParams.get("language") || "en";
  if (!address) {
    console.error("Missing address parameter");
    return json({ error: "Address parameter is required" }, {
      status: 400,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  }
  if (!private_env.MAPBOX_TOKEN) {
    console.error("Missing MAPBOX_TOKEN");
    return json({ error: "Mapbox token not configured" }, {
      status: 500,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  }
  try {
    console.log("Calling Mapbox API for address:", address);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` + new URLSearchParams({
      access_token: private_env.MAPBOX_TOKEN,
      language,
      types: "address,place,country",
      limit: "5"
    });
    console.log("Mapbox URL:", mapboxUrl);
    const response = await fetch(mapboxUrl);
    console.log("Mapbox response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mapbox API error:", errorText);
      throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log("Mapbox API response:", JSON.stringify(data, null, 2));
    return json(data, {
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return json({ error: "Failed to geocode address", details: error.message }, {
      status: 500,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  }
}
async function POST({ request }) {
  try {
    const { lng, lat } = await request.json();
    console.log("Reverse geocoding request for coordinates:", { lng, lat });
    if (!lng || !lat) {
      console.error("Missing coordinates");
      return json({ error: "Longitude and latitude are required" }, {
        status: 400,
        headers: {
          "content-type": "application/json",
          "Cache-Control": "no-cache"
        }
      });
    }
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` + new URLSearchParams({
      access_token: private_env.MAPBOX_TOKEN,
      types: "address",
      limit: "1"
    });
    console.log("Mapbox reverse geocoding URL:", mapboxUrl);
    const response = await fetch(mapboxUrl);
    console.log("Mapbox response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mapbox API error:", errorText);
      throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log("Mapbox API response:", JSON.stringify(data, null, 2));
    return json(data, {
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return json({ error: "Failed to reverse geocode coordinates", details: error.message }, {
      status: 500,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  }
}
export {
  GET,
  POST
};
//# sourceMappingURL=_server.ts.js.map
