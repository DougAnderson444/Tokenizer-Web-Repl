# Components 

This REPL can run locally from the filesystem, or be saved to a static site like IPFS, permaweb like Arweave, and is tokenized to Solana.

Components are saved to an array of components.

Compiled via Rollup is saved to worker.js.

For wasm plugin I'll need a new plugin.

## Based on REPLicant from  Svelte Summit 2020

[https://github.com/pngwn/REPLicant](https://github.com/pngwn/REPLicant)

## Enhancements

This REPL will run in the local file system, since the `Worker` was tweaked to import a blob/URL instead of the path.

```js
// const worker = new Worker("./worker.js");  //<-- Original way

// New way:
	let worker;
	let workersUrl = "/worker.js";
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

```



## Usage

Clone and install

```bash
git clone https://github.com/pngwn/REPLicant.git && cd REPLicant

pnpm i # or yarn or npm i
```

Run the dev server and play around:

```bash
pnpm dev
```


## Further reading

- To understand the Svelte API itself - [tutorial](https://svelte.dev/tutorial/) - [docs](https://svelte.dev/docs/)
- [Svelte REPL](https://svelte.dev/repl/)
- [mdsvex Playground](https://mdsvex.com/playground)
- [Try Ruby](https://try.ruby-lang.org/)
- [Tour of Go](https://tour.golang.org/welcome/1)
- [Rust Playground](https://play.rust-lang.org/)
- [TypesScript Playground](https://www.typescriptlang.org/play)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Blobs](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [Blob URLS](https://javascript.info/blob)
- [Embedding content and iFrames](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies)
- [Communicating with iFrames](https://javascript.info/cross-window-communication)

## Questions

If you have questions or feedback then feel to file an issue here, bug me on twitter ([@evilpingwin](https://twitter.com/evilpingwin)), or you can grab me on discord (@pngwn).
