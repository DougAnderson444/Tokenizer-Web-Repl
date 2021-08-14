<script>
	import { onMount } from "svelte";
	import TestWeave from "testweave-sdk";
	import Notify from "./Notify.svelte";
	import { inlineSource } from "inline-source";

	export let serializedSource;
	export let details;
	export let preview;
	export let publish;

	let account = "2kNoPZhth7i9nRBQikdHUUYP9vx9FqPQP66zaQFDEtoU"; // example

	let coinEndpoint =
		"https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=USD";
	// {"arweave":{"usd":16.22}}

	const WINSTON_PER_AR = 1000000000000;
	let visible = true;

	let ready;
	let color = "primary";
	let arweave;
	let testWeave;
	let statusBeforePost;
	let statusAfterPost;
	let statusAfterMine;
	let current = "loading...";
	let mounted = false;
	let dataTransaction;
	let srcData;
	let cost;
	let cost_in_ar;
	let ar_price;
	let costPerByte;
	let dataSize;

	onMount(async () => {
		setTimeout(fireWhenReady, 150);
	});

	// wait for arweave to have loaded
	const fireWhenReady = () => {
		if (typeof Arweave != "undefined") {
			ready = true;
			// console.log({ Arweave });
			init();
		} else {
			// console.log("no Arweave yet, try again real soon");
			setTimeout(fireWhenReady, 500);
		}
	};

	async function init() {
		arweave = Arweave.init({
			host: "localhost",
			port: 1984,
			protocol: "http",
			timeout: 20000,
			logging: false,
		});
		// init TestWeave on the top of arweave
		// console.log({ TestWeave });
		testWeave = await TestWeave.default.init(arweave);
		// console.log({ testWeave });

		let endpointResponse = await fetch(coinEndpoint);
		let responseJson = await endpointResponse.json();
		ar_price = responseJson.arweave.usd;
	}

	const handleCreateTx = async () => {
		let inlinedSource = await inlineSource(serializedSource);

		dataTransaction = await arweave.createTransaction(
			{
				data: inlinedSource,
			},
			testWeave.rootJWK
		);

		dataTransaction.addTag("Content-Type", "text/html");

		await arweave.transactions.sign(dataTransaction, testWeave.rootJWK);

		let status = await arweave.transactions.getStatus(dataTransaction.id);

		console.log({ status });

		status = await arweave.transactions.post(dataTransaction);

		console.log({ status });

		cost = dataTransaction.reward;
		cost_in_ar = arweave.ar.winstonToAr(cost);
		dataSize = dataTransaction.data_size;
		costPerByte = cost_in_ar / dataTransaction.data_size;
	};

	const mine = async () => {
		console.log("mining");
		await testWeave.mine();
		statusAfterMine = await arweave.transactions.getStatus(dataTransaction.id);
		console.log({ statusAfterMine }); // this will return 200
		srcData = await arweave.transactions.getData(dataTransaction.id, {
			decode: true,
			string: true,
		});
	};

	$: preview && handleCreateTx();
	$: publish && mine();
	$: visible = preview || publish;
</script>

<svelte:head>
	<script src="https://unpkg.com/arweave/bundles/web.bundle.js"></script>
</svelte:head>
{#if arweave && arweave.api.config.host}
	<span class="connected">Connected to Arweave {arweave.api.config.host}</span>
{:else}
	<span class="not-connected">Not connected to Arweave</span>
{/if}
{#if preview}
	<Notify visible={preview}>
		{#if costPerByte}
			Cost is {cost_in_ar}AR @ {ar_price}/AR = {cost_in_ar * ar_price * 100}
			<strong>cents</strong><br />
		{:else}
			Preparing preview...
		{/if}
	</Notify>
{/if}

{#if publish}
	<Notify visible={publish}>
		{#if srcData}
			<a
				href="http://localhost:1984/{dataTransaction.id}/?account={account}"
				target="_blank">Tx Link</a
			>
		{:else}
			Mining...
		{/if}
	</Notify>
{/if}

<style>
	span {
		position: relative;
		top: -20px;
		padding-left: 9px;
	}
	.connected {
		color: green;
	}
	.not-connected {
		color: rgb(214, 93, 93);
	}
</style>
