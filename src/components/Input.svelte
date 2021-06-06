<script lang="ts">
	import Tabs from "./Tabs.svelte";
	import ModuleEditor from "./ModuleEditor.svelte";
	import type { Component } from "../types";
	import { components, current } from "../js/store.js";
	import { getContext } from "svelte";

	const { handle_select, editor_focus } = getContext("REPL");

	function get_max(_components: Component[]): number {
		const ids = _components.map(({ id }) => id);
		return Math.max(...ids);
	}

	function new_component() {
		const id = get_max($components) + 1;

		$components = $components.concat({
			id,
			name: `Component${id}`,
			type: "svelte",
			source: `Component ${id}`,
		});

		$current = id;
		handle_select(id);
		editor_focus();
	}
	function selectComponent({ detail }) {
		if ($current !== detail) {
			$current = detail;
			handle_select(detail);
		}
	}
	$: current_component_index = $components.findIndex(({ id }) => {
		id === $current;
		// module_editor.set(component.source, component.type);
		// module_editor.set(component.source, component.type);
	});
	$: tabs = $components.map(({ id, name, type }) => ({ id, name, type }));
</script>

<Tabs {tabs} on:select={selectComponent} on:new={new_component} />
<section>
	<ModuleEditor />
</section>
