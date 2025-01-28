

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.xulQ3SDS.js","_app/immutable/chunks/CvM60qSQ.js","_app/immutable/chunks/D3t6v8w7.js"];
export const stylesheets = ["_app/immutable/assets/2.f9NwdV4G.css"];
export const fonts = [];
