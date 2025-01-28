import { j as json } from "../../../../../chunks/index.js";
import { d as private_env } from "../../../../../chunks/shared-server.js";
const AIRTABLE_BASE_ID = private_env.AIRTABLE_BASE_ID;
const AIRTABLE_PAT = private_env.AIRTABLE_PAT;
const productMapping = {
  "poem-booth-1": "recPoEmBoOtH123",
  "eventpartner": "recEvTpArTnEr456",
  "eventspecialist": "recEvTsPeC789",
  "extra-language": "recExTrAlAnG012",
  "branding": "recBrAnDiNg345",
  "theme": "recThEmE678",
  "printer-1": "recPrInTeR901",
  "roast": "recRoAsT234",
  "transport": "recTrAnSpOrT567",
  "keynote": "recKeYnOtE890"
};
const GET = async ({ params }) => {
  const { id } = params;
  if (!id || !productMapping[id]) {
    return json({ error: "Product ID not found" }, { status: 404 });
  }
  const airtableId = productMapping[id];
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Products/${airtableId}`,
      {
        headers: {
          "Authorization": `Bearer ${AIRTABLE_PAT}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Airtable request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return json({ id: airtableId, ...data.fields });
  } catch (error) {
    console.error("Error fetching product:", error);
    return json({ error: "Error fetching product" }, { status: 500 });
  }
};
export {
  GET
};
//# sourceMappingURL=_server.ts.js.map
