<script lang="ts">
	import { onMount, setContext } from "svelte";
	import Header from "./components/Header.svelte";
	import Input from "./components/Input.svelte";
	import Output from "./components/Output.svelte";
	import ModuleEditor from "./components/ModuleEditor.svelte";

	import SplitPane from "./components/SplitPane.svelte";

	import { code_1, code_2, code_3, code_4 } from "./_source";
	import type { Component } from "./types";
	import { components, currentID, currentIndex } from "./js/store.js";

	import { ImmortalDB } from "immortal-db";
	import Saver from "./js/ipfs-saver.js";
	import { is_browser } from "./js/env.js";

	import DataWorker from "web-worker:./worker.js"; // rollup generates this for us, then the DataWorker rollup plugin uses it

	export let orientation = "columns";
	export let fixed = false;
	export let fixedPos = 50;

	let type, pos;
	let serializedSource;
	let rootCID;
	let compiled, warnings, diagnostics;
	let srcdoc;
	let injectedCSS;
	let module_editor;
	let saveStatus;
	let saver;

	$: type = orientation === "rows" ? "vertical" : "horizontal";
	$: pos = fixed ? fixedPos : orientation === "rows" ? 50 : 50;

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

	// TODO: cache & get feedback message, just like Bundler
	// 	{
	// 	workersUrl,
	// 	onstatus: (message) => {
	// 		saveStatus = message;
	// 	},
	// }

	let mounted = false;
	// components.set(defaultComps);

	onMount(async () => {
		// setup some globals
		import("buffer").then((Buffer) => {
			global.Buffer = Buffer.Buffer;
		});

		// init IPFS saver
		saver = is_browser && new Saver();
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

	let timer = 1;

	const worker = new DataWorker();

	worker.addEventListener("message", async (event) => {
		if (timer) return; // ignore if there's another worker thread going, wait for that output
		// no timer left, so use this compiled output
		compiled = event.data.output;
		warnings = event.data.warnings;
		diagnostics = event.data.diagnostics;

		// save to IPFS, or where ever
		rootCID = saver.save({
			source: $components,
			compiled,
		});
	});

	async function compile(_components: Component[]): Promise<void> {
		// post data msg to compiler
		if (timer) {
			clearTimeout(timer); // cancel any exisitng waiting
		}
		timer = setTimeout(async () => {
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
			$components.find(({ id }) => id === $currentID).source =
				event.detail.value;
			$components = $components; // trigger reactivity in svelte store
		},
		handle_select(selectedID) {
			const match = $components.find(({ id }) => id === selectedID);
			$currentIndex = $components.findIndex(({ id }) => id === selectedID);
			$currentID = match.id; // won't let me assign current = findIndex for some reason...
			module_editor.set(match.source, match.type);
		},
		editor_focus() {
			module_editor.focus();
		},
		// navigate(item) {
		// 	const match = /^(.+)\.(\w+)$/.exec(item.filename);
		// 	if (!match) return; // ???

		// 	const [, name, type] = match;
		// 	const component = $components.find(
		// 		(c) => c.name === name && c.type === type
		// 	);
		// 	handle_select(component);

		// 	// TODO select the line/column in question
		// }
	});

	// compile whenever non-null components change ($:)
	$: $components && compile($components);
</script>

<svelte:head>
	<script>
		global = globalThis; // for solana web3 repo
	</script>
</svelte:head>

<div class="contain" class:orientation>
	<div class="top-half">
		<Header bind:serializedSource />
		<Input {diagnostics} {saveStatus} {rootCID} {serializedSource} />
	</div>
	<div class="bottom-half">
		<SplitPane {type} {pos} {fixed}>
			<section slot="a" style="height: 100%;">
				{#if $components}
					<ModuleEditor />
				{/if}
			</section>

			<section slot="b" style="height: 100%;">
				<Output {compiled} {injectedCSS} bind:srcdoc bind:serializedSource />
			</section>
		</SplitPane>
	</div>
</div>

<!-- <footer class="footer">Copyright @DougAnderson444 Douglas Anderson</footer> -->
<style>
	.bottom-half {
		flex: 1;
	}

	.contain {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		/* height: 96vh; */
		height: 98%;
	}

	.contain :global(section) {
		position: relative;
		/* padding: 42px 0 0 0; */
		height: 100%;
		box-sizing: border-box;
	}

	.contain :global(section) > :global(*):first-child {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 42px;
		box-sizing: border-box;
	}

	.contain :global(section) > :global(*):last-child {
		width: 100%;
		height: 100%;
	}
</style>
