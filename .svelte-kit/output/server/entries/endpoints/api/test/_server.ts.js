import { j as json } from "../../../../chunks/index.js";
async function GET() {
  return json({ message: "Test endpoint working" }, {
    headers: {
      "content-type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
}
export {
  GET
};
//# sourceMappingURL=_server.ts.js.map
