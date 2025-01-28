

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.VmgJ_kQz.js","_app/immutable/chunks/D_YW4clq.js","_app/immutable/chunks/Be0PZ81N.js"];
export const stylesheets = ["_app/immutable/assets/2.Bk_a0LKS.css"];
export const fonts = [];
