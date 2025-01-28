import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.Bug28efI.js","_app/immutable/chunks/CvM60qSQ.js","_app/immutable/chunks/D3t6v8w7.js"];
export const stylesheets = [];
export const fonts = [];
