<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';

	interface Props {
		label: string;
		value: string | number;
		colorClass?: string;
		loading?: boolean;
	}

	let { label, value, colorClass = 'text-gray-900', loading = false }: Props = $props();
</script>

<Card>
	<CardContent class="p-6">
		<dt class="truncate text-sm font-medium text-gray-500">{label}</dt>
		{#if loading}
			<dd class="mt-1 text-3xl font-semibold tracking-tight {colorClass}" data-loading-skeleton>
				...
			</dd>
		{:else}
			<dd class="mt-1 text-3xl font-semibold tracking-tight {colorClass}">
				{value}
			</dd>
		{/if}
	</CardContent>
</Card>
