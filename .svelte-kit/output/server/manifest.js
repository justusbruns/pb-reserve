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
		client: {"start":"_app/immutable/entry/start.DFLsdvd2.js","app":"_app/immutable/entry/app.ayLbtjNa.js","imports":["_app/immutable/entry/start.DFLsdvd2.js","_app/immutable/chunks/Cp7kWzhg.js","_app/immutable/chunks/CvM60qSQ.js","_app/immutable/entry/app.ayLbtjNa.js","_app/immutable/chunks/CvM60qSQ.js","_app/immutable/chunks/D3t6v8w7.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/auth/_server.js'))
			},
			{
				id: "/api/directions",
				pattern: /^\/api\/directions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/directions/_server.ts.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/events/_server.js'))
			},
			{
				id: "/api/geocoding",
				pattern: /^\/api\/geocoding\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/geocoding/_server.ts.js'))
			},
			{
				id: "/api/organizations",
				pattern: /^\/api\/organizations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/organizations/_server.js'))
			},
			{
				id: "/api/persons",
				pattern: /^\/api\/persons\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/persons/_server.js'))
			},
			{
				id: "/api/products",
				pattern: /^\/api\/products\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/products/_server.js'))
			},
			{
				id: "/api/products/[id]",
				pattern: /^\/api\/products\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/products/_id_/_server.ts.js'))
			},
			{
				id: "/api/reservations",
				pattern: /^\/api\/reservations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reservations/_server.ts.js'))
			},
			{
				id: "/api/staticmap",
				pattern: /^\/api\/staticmap\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/staticmap/_server.ts.js'))
			},
			{
				id: "/api/test",
				pattern: /^\/api\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/test/_server.ts.js'))
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
