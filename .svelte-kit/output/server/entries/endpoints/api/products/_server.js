import { j as json } from "../../../../chunks/index.js";
import { b as base, f as formatRecord, h as handleAirtableError } from "../../../../chunks/airtable.js";
async function GET({ url }) {
  try {
    const records = await base("Products").select().all();
    return json(records.map(formatRecord));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
async function POST({ request }) {
  try {
    const data = await request.json();
    const record = await base("Products").create(data);
    return json(formatRecord(record));
  } catch (error) {
    const { error: errorMessage, status } = handleAirtableError(error);
    return json({ error: errorMessage }, { status });
  }
}
export {
  GET,
  POST
};
//# sourceMappingURL=_server.js.map
