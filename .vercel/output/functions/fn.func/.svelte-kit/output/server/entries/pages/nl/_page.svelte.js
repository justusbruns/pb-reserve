import { c as create_ssr_component } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``}`;
});
export {
  Page as default
};
//# sourceMappingURL=_page.svelte.js.map
