<script lang="ts">
	import { onMount } from "svelte";

	import Input from "./Input.svelte";
	import Output from "./Output.svelte";
	import type { Component } from "./types";

	export let components: Component[] = [
		{
			id: 0,
			name: "App",
			type: "svx",
			source: `

---
title: Awesome Title
author: Doug
date: Today

---

<script>
import Component from './Component1.svelte';
import Layout from './layout.svelte';

<\/script>
<Layout {title} {author} {date} >
<Component />

# Hi 

## Hello

### very small


\`\`\`ts

import statement from 'module'

let variable = 0
\`\`\`

</Layout>

`,
		},
		{
			id: 1,
			name: "Component1",
			type: "svelte",
			source: `
<h1>Hello</h1>

<style>h1 {color: red;}</style>
			`,
		},{
			id: 2,
			name: "layout",
			type: "svelte",
			source: `
<script>
  export let title;
  export let author;
  export let date;
<\/script>

<h1>{ title }</h1>

<slot>
</slot>

<p class="date">on: { date }</p>
<p class="date">by: { author }</p>

`,
		},
	];

	let current: number = 0;

	// const worker = new Worker("./worker.js");
	let worker;
	let workersUrl = "/worker.js";
	
	let injectedCSS

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
