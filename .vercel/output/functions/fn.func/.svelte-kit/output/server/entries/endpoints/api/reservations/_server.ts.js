import { j as json } from "../../../../chunks/index.js";
import { b as base, f as formatRecord, h as handleAirtableError } from "../../../../chunks/airtable.js";
async function GET({ url }) {
  try {
    const records = await base("Reservations").select().all();
    return json(records.map(formatRecord));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function POST({ request }) {
  try {
    const data = await request.json();
    const record = await base("Reservations").create(data);
    return json(formatRecord(record));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function PATCH({ request, url }) {
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "Missing id parameter" }, { status: 400 });
    }
    const data = await request.json();
    const record = await base("Reservations").update(id, data);
    return json(formatRecord(record));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function DELETE({ url }) {
  try {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ error: "Missing id parameter" }, { status: 400 });
    }
    await base("Reservations").destroy(id);
    return json({ success: true });
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
//# sourceMappingURL=_server.ts.js.map
