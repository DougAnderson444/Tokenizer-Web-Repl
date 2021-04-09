import type { Component } from "./types";

import * as rollup from "rollup/dist/es/rollup.browser.js";

// you could use unpkg like the official repl, i thought i'd try out jsdelivr
const CDN_URL = "https://cdn.jsdelivr.net/npm";
importScripts(`${CDN_URL}/svelte/compiler.js`); // importScripts method of the WorkerGlobalScope interface synchronously imports one or more scripts into the worker's scope

const component_lookup: Map<string, Component> = new Map();

async function fetch_package(url: string): Promise<string> {
	return (await fetch(url)).text();
}

function generate_lookup(components: Component[]): void {
	components.forEach((component) => {
		component_lookup.set(`./${component.name}.${component.type}`, component);
	});
}

self.addEventListener(
	"message",
	async (event: MessageEvent<Component[]>): Promise<void> => {
		generate_lookup(event.data);

		// 1. First we bundle, then we 
		// 2. generate actual source code
		const bundle = await rollup.rollup({
			input: "./App.svelte",
			plugins: [
				{
					name: "repl-plugin",
					async resolveId(importee: string, importer: string) {
						// handle imports from 'svelte'

						// import x from 'svelte'
						if (importee === "svelte") return `${CDN_URL}/svelte/index.mjs`;

						// import x from 'svelte/somewhere'
						if (importee.startsWith("svelte/")) {
							// .svelte i 7 characters long
							return `${CDN_URL}/svelte/${importee.slice(7)}/index.mjs`;
						}

						// import x from './file.js' (via a 'svelte' or 'svelte/x' package)
						if (importer && importer.startsWith(`${CDN_URL}/svelte`)) {
							const resolved = new URL(importee, importer).href;
							if (resolved.endsWith(".mjs")) return resolved;
							return `${resolved}/index.mjs`;
						}

						// local repl components
						// check that this file is in that component look up
						if (component_lookup.has(importee)) return importee;

						// relative imports from a remote package
						if (importee.startsWith("."))
							return new URL(importee, importer).href;

						// bare named module imports (importing an npm package)

						// get the package.json and load it into memory
						const pkg_url = `${CDN_URL}/${importee}/package.json`;
						const pkg = JSON.parse(await fetch_package(pkg_url));

						// get an entry point from the pkg.json - first try svelte, then modules, then main
						if (pkg.svelte || pkg.module || pkg.main) {
							// use the aobove url minus `/package.json` to resolve the URL
							const url = pkg_url.replace(/\/package\.json$/, "");
							return new URL(pkg.svelte || pkg.module || pkg.main, `${url}/`)
								.href;
						}

						// we probably missed stuff, pass it along as is
						return importee;
					},
					// id is the filepath
					async load(id: string) {
						// local repl components are stored in memory
						// this is our virtual filesystem
						if (component_lookup.has(id))
							return component_lookup.get(id).source;

						// everything else comes from a cdn
						return await fetch_package(id);
					},
					// transform allows us to compile our non-js code
					// id is the filepath
					transform(code: string, id: string) {
						// our only transform is to compile svelte components
						// svelte is avilable to us because we did importScripts at the top
						//@ts-ignore
						if (/.*\.svelte/.test(id)) {
							const { js, css } = svelte.compile(code)
							return js.code;
							// return {
							// 	id,
							// 	result: {
							// 		js: js.code,
							// 		css: css.code || `/* Add a <sty` + `le> tag to see compiled CSS */`
							// 	}
							// };
						}
					},
				},
			],
		});

		// a touch longwinded but output contains an array of chunks
		// we are not code-splitting, so we only have a single chunk
		const output: string = (await bundle.generate({ format: "esm" })).output[0]
			.code;

		self.postMessage(output);
	}
);
