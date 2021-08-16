<script lang="ts">
	import type { Component, Tab } from "../types";
	import { currentID, components, currentIndex } from "../js/store.js";
	import { createEventDispatcher, getContext } from "svelte";

	const { editor_focus } = getContext("REPL");

	const dispatch = createEventDispatcher<{ select: number; new: undefined }>();

	let editing: Tab;

	function isComponentNameUsed(editing: Tab): any {
		return $components.find(
			// check if the name matches on a different id
			(component) =>
				component.name === editing.name && component.id !== editing.id
		);
	}

	function selectComponent(id) {
		if ($currentID !== id) {
			editing = null;
			dispatch("select", id);
		}
	}

	function editTab(params) {
		const { id, name, type } = params;
		if (editing?.id !== id) {
			editing = {
				id,
				name,
				type,
			};
		}
	}

	function closeEdit() {
		if (!editing) return;
		const match = /(.+)\.(svelte|svx|js)$/.exec(editing.name);
		// match: Array ["app.svx", "app", "svx"]

		$components.find(({ id }) => id === $currentID).name = match
			? match[1]
			: editing.name;

		if (isComponentNameUsed(editing)) {
			$components.find(({ id }) => id === $currentID).name =
				$components.find(({ id }) => id === $currentID).name + "_copy";
		}
		if (match && match[2]) {
			$components.find(({ id }) => id === $currentID).type = match[2];
		}

		editing = null;

		// re-select, in case the type changed
		dispatch("select", $components.find(({ id }) => id === $currentID).id);

		$components = $components; // to refresh tabs

		// focus the editor, but wait a beat (so key events aren't misdirected)
		setTimeout(editor_focus);
	}

	function selectInput(event) {
		setTimeout(() => {
			event.target.select();
		});
	}

	async function remove(component) {
		let result = confirm(
			`Are you sure you want to delete ${component.name}.${component.type}?`
		);

		if (result) {
			const index = $components.indexOf(component);

			if (index) {
				components.set(
					$components.slice(0, index).concat($components.slice(index + 1))
				);
			} else {
				console.error(`Could not find component! That's... odd`);
			}

			// reset if necessary
			$currentIndex = $components[$currentIndex]
				? $currentIndex
				: $components.length - 1;

			dispatch("select", $components[$currentIndex].id);
		}
	}
</script>

<div class="tabs">
	<ul class="side-buttons">
		{#if $components}
			{#each $components as { name, type, id }}
				<li
					class:active={$components.find(({ id: _id }) => id === _id).id ===
						$currentID}
					class="button"
					on:click={() =>
						selectComponent($components.find(({ id: _id }) => id === _id).id)}
					on:dblclick={(e) => e.stopPropagation()}
				>
					{#if name == "App" && id === 0}
						<div class="uneditable">App.{type}</div>
					{:else if id === editing?.id}
						<span class="input-sizer">
							<!-- {editing.name + (/\./.test(editing.name) ? "" : `.${editing.type}`)} -->
						</span>

						<!-- svelte-ignore a11y-autofocus -->
						<input
							autofocus
							spellcheck={false}
							bind:value={editing.name}
							on:focus={selectInput}
							on:blur={closeEdit}
							on:keydown={(e) =>
								e.key === "Enter" &&
								!isComponentNameUsed(editing) &&
								e.currentTarget.blur()}
							class:duplicate={isComponentNameUsed(editing)}
						/>
					{:else}
						<div
							class="editable"
							title="edit component name"
							on:click={() =>
								editTab($components.find(({ id: _id }) => id === _id))}
						>
							{name}.{type}
						</div>

						<span
							class="remove"
							on:click={() =>
								remove($components.find(({ id: _id }) => id === _id))}
						>
							<svg width="12" height="12" viewBox="0 0 24 24">
								<line stroke="#999" x1="18" y1="6" x2="6" y2="18" />
								<line stroke="#999" x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</span>
					{/if}
				</li>
			{/each}
		{/if}
		<li class="button add-sign" on:click={() => dispatch("new")}>➕</li>
	</ul>
</div>

<style>
	.tabs {
		height: auto;
	}
	.active {
		font-weight: 900;
		/* text-decoration: underline; */
	}
	.side-buttons .button,
	.side-buttons button {
		font-size: 1.25rem;
		text-align: left;
	}

	.side-buttons .button {
		padding-left: 12px;
	}

	.side-buttons .button.active {
		font-weight: bolder;
		background-color: rgba(209, 250, 229);
	}
	.editable,
	.uneditable,
	.input-sizer,
	input {
		display: inline-block;
		position: relative;
		line-height: 1;
	}

	.input-sizer {
		color: #ccc;
	}
	.side-buttons .button.active .editable {
		cursor: text;
		font-weight: bold;
	}
	.file-tabs .button.active .remove {
		display: block;
	}

	.file-tabs .button.funky,
	.file-tabs .button.funky.active {
		border-left: 1px solid #ddd;
		border-bottom: none;
		background: transparent;
	}

	.button.funky:last-child {
		border-left: 1px solid #ddd;
		border-right: 1px solid #ddd;
	}

	.add-sign {
		padding-right: 12px !important;
	}
	ul {
		padding-left: 0rem;
		display: flex;
		flex-wrap: wrap;
	}
</style>
