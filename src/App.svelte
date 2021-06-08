<script lang="ts">
	import { onMount, setContext } from "svelte";
	import Header from "./components/Header.svelte";
	import Input from "./components/Input.svelte";
	import Output from "./components/Output.svelte";

	import { code_1, code_2, code_3, code_4 } from "./_source";
	import type { Component } from "./types";
	import { components, current } from "./js/store.js";

	import { ImmortalDB } from "immortal-db";

	const COMPONENTS_KEY = "components";

	const defaultComps = [
		{
			id: 0,
			name: "App",
			type: "svx",
			source: code_1,
		},
		{
			id: 1,
			name: "Layout",
			type: "svelte",
			source: code_3,
		},
		{
			id: 2,
			name: "Solana",
			type: "svelte",
			source: code_2,
		},
		{
			id: 3,
			name: "Asset",
			type: "svelte",
			source: code_4,
		},
	];

	let mounted = false;

	onMount(async () => {
		// setup some globals
		import("buffer").then((Buffer) => {
			global.Buffer = Buffer.Buffer;
		});

		// check for last used components
		const def: null = null;
		const storedValue = await ImmortalDB.get(COMPONENTS_KEY, def);

		let parsedStore;
		if (storedValue) parsedStore = JSON.parse(storedValue);

		if (parsedStore && parsedStore.length > 0) {
			// load saved components
			components.set(parsedStore);
		} else {
			// intial defaults
			components.set(defaultComps);
		}
		mounted = true;
	});

	// const worker = new Worker("./worker.js");
	let worker;
	let workersUrl = "worker.js";

	let compiled;
	let srcdoc;
	let injectedCSS;
	let module_editor;

	try {
		worker = new Worker(workersUrl);
		worker.onerror = function (event) {
			event.preventDefault();
			worker = createWorkerFallback(workersUrl);
		};
	} catch (e) {
		worker = createWorkerFallback(workersUrl);
	}

	function createWorkerFallback(workerUrl) {
		let worker = null;
		workerUrl =
			window.location.href.substring(0, window.location.href.lastIndexOf("/")) +
			"/" +
			workerUrl;
		try {
			let blob;
			try {
				blob = new Blob(["importScripts('" + workerUrl + "');"], {
					type: "application/javascript",
				});
			} catch (e) {
				const blobBuilder = new (window.BlobBuilder ||
					window.WebKitBlobBuilder ||
					window.MozBlobBuilder)();
				blobBuilder.append("importScripts('" + workerUrl + "');");
				blob = blobBuilder.getBlob("application/javascript");
			}
			const url = window.URL || window.webkitURL;
			const blobUrl = url.createObjectURL(blob);
			worker = new Worker(blobUrl);
			URL.revokeObjectURL(blobUrl); // free up the memory
		} catch (e1) {
			// if it still fails, there is nothing much we can do
		}
		return worker;
	}

	let timer = 1;

	worker.addEventListener("message", (event) => {
		if (!timer) compiled = event.data.output;
	});

	async function compile(_components: Component[]): Promise<void> {
		// post data msg to compiler
		if (timer) {
			clearTimeout(timer); // cancel any exisitng waiting
			console.log("clear timer");
		}
		timer = setTimeout(async () => {
			console.log("compiling");
			timer = 0;
			worker.postMessage(_components);
			// also update store
			await ImmortalDB.set(COMPONENTS_KEY, JSON.stringify(_components));
		}, 400);
	}

	// pass these functions down to child components
	setContext("REPL", {
		register_module_editor(editor) {
			module_editor = editor;
		},
		handle_edit(event) {
			$components[$current].source = event.detail.value;
		},
		handle_select(id) {
			$current = id;
			module_editor.update($components[$current].source);
		},
		editor_focus() {
			module_editor.focus();
		},
	});

	// compile whenever non-null components change ($:)
	$: if ($components) compile($components);

	// $: save(compiled);
</script>

<svelte:head>
	<script>
		global = globalThis; // for solana web3 repo
	</script>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css"
	/>
</svelte:head>

<div class="wrapper" />
<main class="main">
	{#if mounted && $components}
		<Input />
		<Output {compiled} {injectedCSS} bind:srcdoc />
	{/if}
</main>
<footer class="footer">Footer</footer>

<style>
	.wrapper {
		display: flex;
		flex-flow: row wrap;
		font-weight: bold;
		text-align: center;
	}

	.wrapper > * {
		padding: 10px;
		flex: 1 100%;
	}

	.header {
		margin: 0 auto;
	}

	.footer {
		background: lightgreen;
	}

	@media all and (min-width: 800px) {
		.main {
			flex: 3 0px;
		}

		.main {
			order: 2;
		}

		.footer {
			order: 4;
		}
	}
</style>
