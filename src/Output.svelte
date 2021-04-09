<script lang="ts">
	export let compiled: string;

	let iframe: HTMLIFrameElement;

	function update(code: string) {
		iframe.contentWindow.postMessage(code, "*"); // origin wildcard
	}

	$: iframe && compiled && update(compiled);

	const srcdoc = `
		<!doctype html>
		<html>
			<head>
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
