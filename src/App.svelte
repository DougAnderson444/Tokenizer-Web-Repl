<script lang="ts">
	import { onMount } from "svelte";

	import Input from "./Input.svelte";
	import Output from "./Output.svelte";

	import { code_1, code_2, code_3 } from "./_source";
	import type { Component } from "./types";

	export let components: Component[] = [
		{
			id: 0,
			name: "App",
			type: "svx",
			source: code_1,
		},
		{
			id: 1,
			name: "Component1",
			type: "svelte",
			source: code_2,
		},
		{
			id: 2,
			name: "layout",
			type: "svelte",
			source: code_3,
		},
	];

	let current: number = 0;

	// const worker = new Worker("./worker.js");
	let worker;
	let workersUrl = "worker.js";

	let injectedCSS;

	try {
		worker = new Worker(workersUrl);
		worker.onerror = function (event) {
			event.preventDefault();
			worker = createWorkerFallback(workersUrl);
		};
	} catch (e) {
		worker = createWorkerFallback(workersUrl);
	}

	let compiled;

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
		compiled = event.data;
	});

	function compile(_components: Component[]): void {
		worker.postMessage(_components);
	}

	$: compile(components);

	// $: save(compiled);
</script>

<main>
	<Input bind:components bind:current />
	<Output {compiled} {injectedCSS} />
</main>
