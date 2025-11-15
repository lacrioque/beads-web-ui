<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import IssueCard from './IssueCard.svelte';
	import { fetchIssues } from '$lib/services/api';
	import type { Issue } from '$lib/services/api';

	interface Props {
		epic: Issue;
		onclick?: () => void;
	}

	let { epic, onclick }: Props = $props();
	let expanded = $state(false);
	let children = $state<Issue[]>([]);
	let loading = $state(false);

	async function toggleExpanded(e: Event) {
		e.stopPropagation();
		expanded = !expanded;

		// Load children if expanding for the first time
		if (expanded && children.length === 0) {
			loading = true;
			try {
				children = await fetchIssues({ parent: epic.id });
			} catch (err) {
				console.error('Failed to load epic children:', err);
			} finally {
				loading = false;
			}
		}
	}

	function navigateToEpic() {
		goto(`/epics/${epic.id}`);
	}

	function navigateToChild(issueId: string, e: Event) {
		e.stopPropagation();
		goto(`/issues/${issueId}`);
	}
</script>

<Card class="border-l-4 border-purple-500 bg-purple-50/30 transition-shadow hover:shadow-md">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex items-center gap-2">
				<button
					onclick={toggleExpanded}
					class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded hover:bg-purple-100"
					title={expanded ? 'Collapse' : 'Expand'}
					aria-label={expanded ? 'Collapse epic' : 'Expand epic'}
				>
					<svg
						class="h-4 w-4 text-purple-600 transition-transform {expanded ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
			d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
				<CardTitle
					class="cursor-pointer text-base font-semibold text-purple-700 hover:text-purple-800"
					onclick={navigateToEpic}
					role="button"
					tabindex={0}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							navigateToEpic();
						}
					}}
				>
					<span class="mr-1">📦</span>
					{epic.id}
				</CardTitle>
			</div>
			<div class="flex flex-shrink-0 items-center gap-2">
				<PriorityBadge priority={epic.priority} />
				<StatusBadge status={epic.status} />
			</div>
		</div>
	</CardHeader>
	<CardContent>
		<p class="mb-2 text-sm font-medium text-gray-900">
			{epic.title}
		</p>

		<!-- Epic badge -->
		<span
			class="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-700/20 ring-inset"
		>
			EPIC
		</span>

		<!-- Children section -->
		{#if expanded}
			<div class="mt-4 border-t border-purple-200 pt-4">
				{#if loading}
					<div class="text-sm text-gray-500">Loading children...</div>
				{:else if children.length === 0}
					<div class="text-sm text-gray-500">No child issues</div>
				{:else}
					<div class="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
						Child Issues ({children.length})
					</div>
					<div class="space-y-2">
						{#each children as child (child.id)}
							<div class="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow">
								<div class="flex items-start justify-between gap-2">
									<button
										onclick={(e) => navigateToChild(child.id, e)}
										class="flex-1 text-left"
									>
										<div class="text-sm font-medium text-blue-600 hover:text-blue-800">
											{child.id}
										</div>
										<div class="mt-1 text-sm text-gray-900">
											{child.title}
										</div>
									</button>
									<div class="flex flex-shrink-0 items-center gap-1">
										<PriorityBadge priority={child.priority} />
										<StatusBadge status={child.status} />
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>
