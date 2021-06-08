<script>
	import { onMount, tick } from "svelte";
	import Arweave from "./Arweave.svelte";
	import SolanaDashboard from "./SolanaDashboard.svelte";
	import {
		Collapse,
		Navbar,
		NavbarToggler,
		NavbarBrand,
		Nav,
		NavItem,
		NavLink,
		Dropdown,
		DropdownToggle,
		DropdownMenu,
		DropdownItem,
		Button,
	} from "sveltestrap";

	export let serializedSource;
	let preview;
	let publish;
	let mounted;
	onMount(async () => {
		mounted = true;
	});

	function previewPage() {
		preview = true;
	}

	function publishPage() {
		publish = true;
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css"
	/>
</svelte:head>

<Navbar color="light" light expand="sm">
	<NavbarBrand><h1>Tokenizer<sup class="super">Web</sup></h1></NavbarBrand>
	<Nav class="ms-auto align-items-baseline" navbar>
		<NavItem>
			<NavLink href="https://github.com/douganderson444/">GitHub</NavLink>
		</NavItem>
		<Dropdown inNavbar>
			<DropdownToggle nav caret>Wallet</DropdownToggle>
			<DropdownMenu end>
				<DropdownItem>Sollet</DropdownItem>
				<DropdownItem>Ledger</DropdownItem>
			</DropdownMenu>
		</Dropdown>
		<Dropdown inNavbar>
			<DropdownToggle nav caret>Solana</DropdownToggle>
			<DropdownMenu end>
				<DropdownItem>Devnet</DropdownItem>
				<DropdownItem>Mainnet</DropdownItem>
			</DropdownMenu>
		</Dropdown>
		<NavItem>
			<Button class="button m-2" on:click={previewPage}>Preview 👓</Button>
		</NavItem>
		<Button class="button m-2" color="info" on:click={publishPage}
			>Publish ✨</Button
		>
	</Nav>
</Navbar>
<SolanaDashboard />
<Arweave {serializedSource} bind:preview bind:publish />

<style>
	.super {
		font-size: 0.75em;
		position: relative;
		bottom: 15px;
		right: 15px;
		color: #88888888;
	}
</style>
