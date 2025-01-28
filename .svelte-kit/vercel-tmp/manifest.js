export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.DF8OSlbZ.js","app":"_app/immutable/entry/app.DnSPMmh1.js","imports":["_app/immutable/entry/start.DF8OSlbZ.js","_app/immutable/chunks/COZzhG_7.js","_app/immutable/chunks/D_YW4clq.js","_app/immutable/entry/app.DnSPMmh1.js","_app/immutable/chunks/D_YW4clq.js","_app/immutable/chunks/Be0PZ81N.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/auth",
				pattern: /^\/api\/auth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/_server.js'))
			},
			{
				id: "/api/directions",
				pattern: /^\/api\/directions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/directions/_server.ts.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/events/_server.js'))
			},
			{
				id: "/api/geocoding",
				pattern: /^\/api\/geocoding\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/geocoding/_server.ts.js'))
			},
			{
				id: "/api/organizations",
				pattern: /^\/api\/organizations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/organizations/_server.js'))
			},
			{
				id: "/api/persons",
				pattern: /^\/api\/persons\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/persons/_server.js'))
			},
			{
				id: "/api/products/[slug]",
				pattern: /^\/api\/products\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/products/_slug_/_server.ts.js'))
			},
			{
				id: "/api/reservations",
				pattern: /^\/api\/reservations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/reservations/_server.ts.js'))
			},
			{
				id: "/api/staticmap",
				pattern: /^\/api\/staticmap\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/staticmap/_server.ts.js'))
			},
			{
				id: "/api/submit-form",
				pattern: /^\/api\/submit-form\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/submit-form/_server.js'))
			},
			{
				id: "/api/test",
				pattern: /^\/api\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test/_server.ts.js'))
			},
			{
				id: "/en",
				pattern: /^\/en\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/nl",
				pattern: /^\/nl\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
