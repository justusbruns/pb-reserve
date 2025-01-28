import { j as json } from "../../../../chunks/index.js";
import { b as base, f as formatRecord, h as handleAirtableError } from "../../../../chunks/airtable.js";
import { r as requireAuth } from "../../../../chunks/auth.js";
async function GET({ request, url }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const id = url.searchParams.get("id");
    const view = url.searchParams.get("view");
    const filterByFormula = url.searchParams.get("filterByFormula");
    let query = base("Events");
    if (id) {
      const record = await query.find(id);
      return json(formatRecord(record));
    } else if (view) {
      const records = await query.select({
        view,
        sort: [{ field: "Starts at", direction: "asc" }]
      }).all();
      return json(records.map(formatRecord));
    } else {
      const records = await query.select({
        filterByFormula,
        sort: [{ field: "Starts at", direction: "desc" }]
      }).all();
      return json(records.map(formatRecord));
    }
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function POST({ request }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    const record = await base("Events").create(data);
    return json(formatRecord(record));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function PATCH({ request, url }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "Missing event ID" }, { status: 400 });
    }
    const data = await request.json();
    const record = await base("Events").update([{ id, fields: data }]);
    return json(formatRecord(record[0]));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function DELETE({ request, url }) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "Missing event ID" }, { status: 400 });
    }
    const record = await base("Events").destroy([id]);
    return json(formatRecord(record[0]));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
export {
  DELETE,
  GET,
  PATCH,
  POST
};
//# sourceMappingURL=_server.js.map
