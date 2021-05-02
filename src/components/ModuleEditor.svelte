<script lang="ts">
	import { onMount, getContext } from "svelte";
	import CodeMirror from "./CodeMirror.svelte";

	const { register_module_editor, handle_edit } = getContext("REPL");

	let editor;
	onMount(() => {
		register_module_editor(editor);
	});
</script>

<div class="editor">
	<CodeMirror bind:this={editor} lineNumbers={false} on:change={handle_edit} />
</div>

<style>
	.editor {
		border: 1px solid lightblue;
		border-radius: 3px;
		margin-bottom: 1em;
		height: calc(100vh - 10%);
	}
</style>
