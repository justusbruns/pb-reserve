import { c as create_ssr_component, a as setContext } from "../../chunks/ssr.js";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  setContext("mapboxToken", data.mapboxToken);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${slots.default ? slots.default({}) : ``}`;
});
export {
  Layout as default
};
//# sourceMappingURL=_layout.svelte.js.map
