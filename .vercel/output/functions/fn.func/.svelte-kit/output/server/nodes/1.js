

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.BhRSzHhm.js","_app/immutable/chunks/CvM60qSQ.js","_app/immutable/chunks/D3t6v8w7.js","_app/immutable/chunks/Cp7kWzhg.js"];
export const stylesheets = [];
export const fonts = [];
