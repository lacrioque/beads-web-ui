<script lang="ts">
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';

	interface Props {
		type?: 'card' | 'stat' | 'list' | 'table';
		count?: number;
	}

	let { type = 'card', count = 1 }: Props = $props();
</script>

{#if type === 'stat'}
	{#each Array(count) as _, i}
		<Card data-loading-skeleton>
			<CardContent class="p-6">
				<Skeleton class="mb-2 h-4 w-24" />
				<Skeleton class="h-8 w-16" />
			</CardContent>
		</Card>
	{/each}
{:else if type === 'card'}
	{#each Array(count) as _, i}
		<Card data-loading-skeleton>
			<CardHeader>
				<Skeleton class="h-5 w-32" />
			</CardHeader>
			<CardContent>
				<Skeleton class="mb-2 h-4 w-full" />
				<Skeleton class="h-4 w-3/4" />
			</CardContent>
		</Card>
	{/each}
{:else if type === 'list'}
	<Card data-loading-skeleton>
		<CardContent class="p-6">
			{#each Array(count) as _, i}
				<div class="py-4 {i !== count - 1 ? 'border-b' : ''}">
					<Skeleton class="mb-2 h-5 w-32" />
					<Skeleton class="h-4 w-full" />
				</div>
			{/each}
		</CardContent>
	</Card>
{:else if type === 'table'}
	<Card data-loading-skeleton>
		<CardContent class="p-6">
			<div class="space-y-3">
				{#each Array(count) as _, i}
					<Skeleton class="h-12 w-full" />
				{/each}
			</div>
		</CardContent>
	</Card>
{/if}
