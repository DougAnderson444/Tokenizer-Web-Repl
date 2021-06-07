<script lang="ts">
	import { onMount, setContext } from "svelte";
	import Input from "./components/Input.svelte";
	import Output from "./components/Output.svelte";

	import { code_1, code_2, code_3 } from "./_source";
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
			name: "Component1",
			type: "svelte",
			source: code_2,
		},
	];

	let mounted = false;

	onMount(async () => {
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

	worker.addEventListener("message", (event) => {
		compiled = event.data.output;
	});

	const delay = (function () {
		var timer = 0;
		return function (callback, ms) {
			clearTimeout(timer);
			timer = setTimeout(callback, ms);
		};
	})();

	let timer;

	async function compile(_components: Component[]): Promise<void> {
		// post data msg to compiler
		if (timer) clearTimeout(timer); // cancel any exisitng waiting
		timer = setTimeout(async () => {
			worker.postMessage(_components);
			// also update store
			await ImmortalDB.set(COMPONENTS_KEY, JSON.stringify(_components));
			timer = false;
		}, 250);
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

<main>
	{#if mounted && $components}
		<Input />
		<Output {compiled} {injectedCSS} bind:srcdoc />
	{/if}
</main>
<p />
