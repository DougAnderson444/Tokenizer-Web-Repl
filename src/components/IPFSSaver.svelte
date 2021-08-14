<script>
	import Message from "../components/Message.svelte";
	import { fade } from "svelte/transition";

	export let saveStatus;
	export let error = false;
	export let rootCID;
	export let serializedSource;
</script>

<div class="outter">
	<div class="inner">
		Automatically saving your work to Web3:
		{#if rootCID}
			{#await rootCID}
				<!-- promise is pending -->
				<p transition:fade>waiting for the promise to resolve...</p>
			{:then rootCID}
				<!-- promise was fulfilled -->
				<p transition:fade>
					The rootCID is <a
						href="https://dweb.link/api/v0/dag/get?arg={rootCID.toString()}"
						target="_blank"
					>
						{rootCID.toString()}</a
					>
				</p>
				<p>Check out your new page here:</p>
				<p>PeerPiper page here:</p>
			{:catch error}
				<!-- promise was rejected -->
				<p transition:fade>Something went wrong: {error.message}</p>
			{/await}
		{/if}
		<div class="overlay">
			{#if error}
				<Message kind="error" details={error} />
			{:else if saveStatus}
				<Message kind="info" truncate>
					{saveStatus || "ready to save..."}
				</Message>
			{/if}
		</div>
	</div>
</div>

<style>
	.outter {
		border: none;
		width: 100%;
		padding: 20px 30px;
	}

	/* .inner {
		min-height: fit-content;
	} */
	.overlay {
		position: absolute;
		bottom: 0;
		width: 100%;
	}
</style>
