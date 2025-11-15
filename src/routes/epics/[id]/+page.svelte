<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fetchEpic } from '$lib/services/api';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		StatusBadge,
		PriorityBadge,
		StatCard,
		LoadingSkeleton
	} from '$lib/components';
	import type { EpicDetails } from '$lib/services/api';

	let epicId = $derived($page.params.id);
	let epicDetails = $state<EpicDetails | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadEpicDetails() {
		try {
			loading = true;
			error = null;
			epicDetails = await fetchEpic(epicId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load epic details';
			console.error('Error loading epic:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadEpicDetails();
	});

	function navigateToIssue(issueId: string) {
		goto(`/issues/${issueId}`);
	}

	function goBack() {
		goto('/');
	}
</script>

<div class="space-y-6">
	<!-- Back button -->
	<button
		onclick={goBack}
		class="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
	>
		<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10 19l-7-7m0 0l7-7m-7 7h18"
			/>
		</svg>
		Back to Overview
	</button>

	{#if loading}
		<div class="space-y-6">
			<LoadingSkeleton type="card" count={1} />
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<LoadingSkeleton type="stat" count={4} />
			</div>
			<LoadingSkeleton type="card" count={1} />
		</div>
	{:else if error}
		<Card class="border-red-200 bg-red-50">
			<CardContent class="pt-6">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Error loading epic</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{error}</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else if epicDetails}
		<!-- Epic header -->
		<Card class="border-l-4 border-purple-500 bg-purple-50/30">
			<CardHeader class="pb-3">
				<div class="flex items-start justify-between">
					<div>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-2xl">📦</span>
							<CardTitle class="text-2xl font-bold text-purple-700">{epicDetails.epic.id}</CardTitle>
						</div>
						<span
							class="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-700/20 ring-inset"
						>
							EPIC
						</span>
					</div>
					<div class="flex items-center gap-2">
						<PriorityBadge priority={epicDetails.epic.priority} />
						<StatusBadge status={epicDetails.epic.status} />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<h1 class="text-xl font-semibold text-gray-900">{epicDetails.epic.title}</h1>
				{#if epicDetails.epic.description}
					<p class="mt-3 text-sm text-gray-600">{epicDetails.epic.description}</p>
				{/if}
				<div class="mt-4 flex gap-4 text-sm text-gray-500">
					<div>
						<span class="font-medium">Created:</span>
						{new Date(epicDetails.epic.created).toLocaleDateString()}
					</div>
					<div>
						<span class="font-medium">Updated:</span>
						{new Date(epicDetails.epic.updated).toLocaleDateString()}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Epic stats -->
		<div>
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Epic Progress</h2>
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Total Children" value={epicDetails.stats.total} />
				<StatCard label="Open" value={epicDetails.stats.open} colorClass="text-blue-600" />
				<StatCard
					label="In Progress"
					value={epicDetails.stats.in_progress}
					colorClass="text-yellow-600"
				/>
				<StatCard label="Closed" value={epicDetails.stats.closed} colorClass="text-green-600" />
			</div>
		</div>

		<!-- Child issues -->
		<div>
			<h2 class="mb-4 text-lg font-semibold text-gray-900">
				Child Issues ({epicDetails.children.length})
			</h2>
			{#if epicDetails.children.length === 0}
				<Card>
					<CardContent class="py-12 text-center">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No child issues</h3>
						<p class="mt-1 text-sm text-gray-500">This epic has no child issues yet.</p>
					</CardContent>
				</Card>
			{:else}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									ID
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Title
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Priority
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Status
								</th>
								<th class="relative px-6 py-3">
									<span class="sr-only">View</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each epicDetails.children as child (child.id)}
								<tr class="transition-colors hover:bg-gray-50">
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm font-medium text-blue-600">{child.id}</div>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm text-gray-900">{child.title}</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<PriorityBadge priority={child.priority} />
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<StatusBadge status={child.status} />
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<button
											onclick={() => navigateToIssue(child.id)}
											class="text-blue-600 hover:text-blue-900"
										>
											View
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
