<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import type { Issue } from '$lib/services/api';

	interface Props {
		issue: Issue;
		onclick?: () => void;
	}

	let { issue, onclick }: Props = $props();
</script>

<Card
	class="cursor-pointer transition-shadow hover:shadow-md"
	role="button"
	tabindex={0}
	{onclick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<CardTitle class="text-base font-semibold text-blue-600">
				{issue.id}
			</CardTitle>
			<div class="flex flex-shrink-0 items-center gap-2">
				<PriorityBadge priority={issue.priority} />
				<StatusBadge status={issue.status} />
			</div>
		</div>
	</CardHeader>
	<CardContent>
		<p class="line-clamp-2 text-sm text-gray-900">
			{issue.title}
		</p>
		{#if issue.type}
			<div class="mt-2">
				<span
					class="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-700/10 ring-inset"
				>
					{issue.type}
				</span>
			</div>
		{/if}
	</CardContent>
</Card>
