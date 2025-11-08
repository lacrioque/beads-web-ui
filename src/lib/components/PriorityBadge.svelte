<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { Issue } from '$lib/services/api';

	interface Props {
		priority: Issue['priority'];
	}

	let { priority }: Props = $props();

	const priorityColors = {
		P1: 'bg-red-100 text-red-800 hover:bg-red-100/80',
		P2: 'bg-orange-100 text-orange-800 hover:bg-orange-100/80',
		P3: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80'
	};
</script>

<Badge class={priorityColors[priority]} data-badge>
	{priority}
</Badge>
