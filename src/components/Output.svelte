<script lang="ts">
	import Saver from "../js/ipfs-saver.js";
	import { is_browser } from "../js/env.js";
	import Message from "../components/Message.svelte";

	export let error; // TODO should this be exposed as a prop?
	export let status;
	export let truncate;

	// import okaidia from "../../prism/okaidia.js"; // prism CSS for code
	export let srcdoc: string;
	export let compiled: string;
	export let injectedCSS: string = `/* Some STYLES */
	html, body {position: relative;width: 100%;height: 100%;}body {color: #333;margin: 0;padding: 0px 2px;box-sizing: border-box;font-family: -apple-system, "Segoe UI", BlinkMacSystemFont, Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;}a {color: rgb(0,100,200);text-decoration: none;}a:hover {text-decoration: underline;}a:visited {color: rgb(0,80,160);}label {display: block;}input, button, select, textarea {font-family: inherit;font-size: inherit;padding: 0.4em;margin: 0 0 0.5em 0;box-sizing: border-box;border: 1px solid #ccc;border-radius: 2px;}input:disabled {color: #ccc;}input[type="range"] {height: 0;}button {color: #333;background-color: #f4f4f4;outline: none;}button:active {background-color: #ddd;}button:focus {border-color: #666;} p:last-child{margin-bottom: 30px;}	
	`;
	export let serializedSource: string;

	//`code[class*=language-],pre[class*=language-]{color:#657b83;font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;font-size:0.9em;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}code[class*=language-] ::-moz-selection,code[class*=language-]::-moz-selection,pre[class*=language-] ::-moz-selection,pre[class*=language-]::-moz-selection{background:#073642}code[class*=language-] ::selection,code[class*=language-]::selection,pre[class*=language-] ::selection,pre[class*=language-]::selection{background:#073642}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto;border-radius:.3em}:not(pre)>code[class*=language-],pre[class*=language-]{background-color:#fdf6e3}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#93a1a1}.token.punctuation{color:#586e75}.token.namespace{opacity:.7}.token.boolean,.token.constant,.token.deleted,.token.number,.token.property,.token.symbol,.token.tag{color:#268bd2}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string,.token.url{color:#2aa198}.token.entity{color:#657b83;background:#eee8d5}.token.atrule,.token.attr-value,.token.keyword{color:#859900}.token.class-name,.token.function{color:#b58900}.token.important,.token.regex,.token.variable{color:#cb4b16}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}.token.entity{cursor:help}`;

	//injectedCSS = okaidia; // prism CSS for code

	const UPDATED = "updated";

	let iframe: HTMLIFrameElement;

	// init IPFS saver
	let saver = is_browser && new Saver();
	let rootCID;

	$: serializedSource && saveSrc();

	const saveSrc = async () => {
		const result = await saver.add({
			path: "index.html",
			content: serializedSource,
		});
		rootCID = result.cid;
		console.log("serializedSource changed");
	};

	function update(code: string) {
		iframe.contentWindow.postMessage(code, location.origin); // "*" origin wildcard
	}

	window.addEventListener(
		"message",
		(event) => {
			if (event.data == UPDATED) {
				// console.log("iframe updated", event.data);
				serializedSource = new XMLSerializer().serializeToString(
					iframe.contentWindow.document
				);
			}
		},
		false
	);

	$: iframe && compiled && update(compiled);
	// ${compiled ? compiled : ""}

	/*
	// other option to add script to head
	// var se = document.createElement('link');
	// se.setAttribute('rel', 'modulepreload');
	// se.setAttribute('src', src64);
	// document.getElementsByTagName('head').item(0).prepend(se);
	*/
	$: srcdoc = `
		<!doctype html>
		<html>
			<head>
				<script id="injected-base64-script">
					// insert var src64 here
					// var me = document.getElementById('injected-base64-script');
				<\/script>
				<link href="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/themes/prism.css" rel="stylesheet" />
				<style>
					/* STYLES */
					${injectedCSS}
				</style>
				<script type="module">

					let component;

					if(typeof src64 != 'undefined'){
						console.log('pre-existing src64, convert and load')
						fetch(src64).then(async function(response){
							const blob = await response.blob()
							const url = URL.createObjectURL(blob);
							import(url).then(function ({ default: App }) {
								if (component) component.$destroy();
								document.getElementById('app').innerHTML = '';
								component = new App({ target: document.getElementById('app') })
							})
						})
					} else {
						console.log('no pre-existing src64')
					}
					
					async function fetchedBlobToDataURL (blobUrl) {

						return new Promise(async function (resolve, reject) {

							const response = await fetch(blobUrl);
							const blob = await response.blob()

							var blobAsDataUrl
							var reader = new FileReader();

							reader.addEventListener("load", function () {
								blobAsDataUrl = this.result;
								resolve(blobAsDataUrl)
							}, false);

							reader.readAsDataURL(blob)
						})
					}

					// <!-- Turn the string into actual javascript code -->
					// <!--   import (url) <- ObjectURL <- Blob         -->

					async function update(source) {
						// <!-- type: 'text/javascript would normally come from response headers -->
						const blob = new Blob([source], { type: 'text/javascript' });
						const url = URL.createObjectURL(blob);
						const src64 = await fetchedBlobToDataURL(url)

						var oldElement = document.getElementById('injected-base64-script');
						oldElement.parentNode.removeChild(oldElement);

						var newElement = document.createElement("script");
						newElement.setAttribute('id', 'injected-base64-script');
						var textnode = document.createTextNode("var src64 = '" + src64 + "'");
						newElement.appendChild(textnode);
						document.getElementsByTagName('head').item(0).prepend(newElement);

						import(url).then(function ({ default: App }) {
							if (component) component.$destroy();

							document.getElementById('app').innerHTML = '';
							component = new App({ target: document.getElementById('app') })

							// URL.revokeObjectURL(url) // memory management 

							window.parent.postMessage("${UPDATED}", window.parent)
						})
					}

					window.addEventListener('message', function (event) {
						update(event.data)
					}, false)

				<\/script>
			</head>
			<body>
				<div id="app"></div>
			</body>
		</html>
	`;
</script>

{#if rootCID}
	{#await rootCID}
		<!-- promise is pending -->
		waiting for the promise to resolve...
	{:then rootCID}
		<!-- promise was fulfilled --><a
			href="https://ipfs.io/ipfs/{rootCID.toString()}?account="
			target="_blank"
		>
			{rootCID.toString()}↗️</a
		>
	{:catch error}
		<!-- promise was rejected -->
		Something went wrong with save: {error.message}
	{/await}
{/if}

<div class="iframe-container">
	<div style="height: 100%">
		<iframe title="Rendered REPL" bind:this={iframe} {srcdoc} />
	</div>

	<div class="overlay">
		{#if error}
			<Message kind={"error"} details={error} />
		{:else if status}
			<Message kind={"info"} {truncate}>
				{status || "loading Svelte compiler..."}
			</Message>
		{/if}
	</div>
</div>

<style></style>
