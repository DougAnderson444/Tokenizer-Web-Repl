<script lang="ts">
	import okaidia from "../../prism/okaidia.js"; // prism CSS for code

	export let compiled: string;
	export let injectedCSS: string = `/* Some STYLES */
	html, body {position: relative;width: 100%;height: 100%;}body {color: #333;margin: 0;padding: 8px 20px;box-sizing: border-box;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;}a {color: rgb(0,100,200);text-decoration: none;}a:hover {text-decoration: underline;}a:visited {color: rgb(0,80,160);}label {display: block;}input, button, select, textarea {font-family: inherit;font-size: inherit;padding: 0.4em;margin: 0 0 0.5em 0;box-sizing: border-box;border: 1px solid #ccc;border-radius: 2px;}input:disabled {color: #ccc;}input[type="range"] {height: 0;}button {color: #333;background-color: #f4f4f4;outline: none;}button:active {background-color: #ddd;}button:focus {border-color: #666;} p:last-child{margin-bottom: 30px;}	
	` 
	//`code[class*=language-],pre[class*=language-]{color:#657b83;font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;font-size:0.9em;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}code[class*=language-] ::-moz-selection,code[class*=language-]::-moz-selection,pre[class*=language-] ::-moz-selection,pre[class*=language-]::-moz-selection{background:#073642}code[class*=language-] ::selection,code[class*=language-]::selection,pre[class*=language-] ::selection,pre[class*=language-]::selection{background:#073642}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto;border-radius:.3em}:not(pre)>code[class*=language-],pre[class*=language-]{background-color:#fdf6e3}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#93a1a1}.token.punctuation{color:#586e75}.token.namespace{opacity:.7}.token.boolean,.token.constant,.token.deleted,.token.number,.token.property,.token.symbol,.token.tag{color:#268bd2}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string,.token.url{color:#2aa198}.token.entity{color:#657b83;background:#eee8d5}.token.atrule,.token.attr-value,.token.keyword{color:#859900}.token.class-name,.token.function{color:#b58900}.token.important,.token.regex,.token.variable{color:#cb4b16}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}.token.entity{cursor:help}`;

	//injectedCSS = okaidia; // prism CSS for code

	let iframe: HTMLIFrameElement;

	function update(code: string) {
		iframe.contentWindow.postMessage(code, "*"); // origin wildcard
	}

	$: iframe && compiled && update(compiled);

	const srcdoc = `
		<!doctype html>
		<html>
			<head>
				<link href="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/themes/prism.css" rel="stylesheet" />
				<style>
					/* STYLES */
					${injectedCSS}
				</style>
				<script type="module">

					let component;
					
					// <!-- Turn the string into actual javascript code -->
					// <!--   import (url) <- ObjectURL <- Blob         -->

					function update(source) {
						// <!-- type: 'text/javascript would normally come from response headers -->
						const blob = new Blob([source], { type: 'text/javascript' });
						const url = URL.createObjectURL(blob);

						import(url).then(({ default: App }) => {
							if (component) component.$destroy();

							document.body.innerHTML = '';
							component = new App({ target: document.body })
						})
					}

					window.addEventListener('message', event => {
						update(event.data)
					}, false)
				<\/script>
			</head>
			<body></body>
		</html>
	`;
</script>

<section>
	<iframe title="Rendered REPL" bind:this={iframe} {srcdoc} />
</section>
