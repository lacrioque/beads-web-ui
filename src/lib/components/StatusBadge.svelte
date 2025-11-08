<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { Issue } from '$lib/services/api';

	interface Props {
		status: Issue['status'];
	}

	let { status }: Props = $props();

	const statusConfig = {
		open: {
			label: 'Open',
			variant: 'default' as const
		},
		in_progress: {
			label: 'In Progress',
			variant: 'secondary' as const
		},
		closed: {
			label: 'Closed',
			variant: 'outline' as const
		}
	};

	const config = $derived(statusConfig[status]);
</script>

<Badge variant={config.variant} class="font-medium" data-badge>
	{config.label}
</Badge>
