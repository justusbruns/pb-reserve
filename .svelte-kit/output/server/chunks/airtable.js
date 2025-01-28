import Airtable from "airtable";
import { A as AIRTABLE_PAT, a as AIRTABLE_BASE_ID } from "./private.js";
const base = new Airtable({
  apiKey: AIRTABLE_PAT,
  endpointUrl: "https://api.airtable.com"
}).base(AIRTABLE_BASE_ID);
function formatRecord(record) {
  return {
    id: record.id,
    ...record.fields
  };
}
function handleAirtableError(error) {
  console.error("Airtable error:", error);
  return {
    error: error.message || "An error occurred while accessing Airtable",
    status: error.statusCode || 500
  };
}
export {
  base as b,
  formatRecord as f,
  handleAirtableError as h
};
//# sourceMappingURL=airtable.js.map
