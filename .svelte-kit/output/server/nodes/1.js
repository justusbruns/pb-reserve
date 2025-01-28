

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.DKhZMCFr.js","_app/immutable/chunks/D_YW4clq.js","_app/immutable/chunks/Be0PZ81N.js","_app/immutable/chunks/COZzhG_7.js"];
export const stylesheets = [];
export const fonts = [];
