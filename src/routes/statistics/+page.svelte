<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchStats } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import type { IssueStats } from '$lib/services/api';

	let stats = $state<IssueStats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadStats() {
		try {
			loading = true;
			error = null;
			stats = await fetchStats();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load statistics';
			console.error('Error loading stats:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadStats();

		// Listen for WebSocket mutations and reload stats
		$effect(() => {
			if (websocketService.mutations.length > 0) {
				console.log('Mutations detected, reloading stats...');
				loadStats();
				websocketService.clearMutations();
			}
		});
	});

	function getPercentage(count: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((count / total) * 100);
	}

	// Derived data for charts
	let byStatus = $derived(stats ? [
		{ label: 'Open', count: stats.open, color: 'bg-blue-500' },
		{ label: 'In Progress', count: stats.in_progress, color: 'bg-yellow-500' },
		{ label: 'Closed', count: stats.closed, color: 'bg-green-500' }
	] : []);

	let byPriority = $derived(stats ? Object.entries(stats.by_priority).map(([label, count]) => ({
		label,
		count,
		color: label === 'P1' ? 'bg-red-500' : label === 'P2' ? 'bg-orange-500' : 'bg-yellow-500'
	})) : []);

	let byType = $derived(stats ? Object.entries(stats.by_type).map(([label, count]) => ({
		label,
		count,
		color: label === 'epic' ? 'bg-purple-500' : label === 'task' ? 'bg-blue-500' : 'bg-red-500'
	})) : []);

	let totalIssues = $derived(stats?.total ?? 0);
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Statistics</h1>
		<p class="mt-2 text-sm text-gray-700">
			Detailed insights and metrics about your issues
		</p>
	</div>

	<!-- Error state -->
	{#if error}
		<div class="rounded-lg bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading statistics</h3>
					<div class="mt-2 text-sm text-red-700">
						<p>{error}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading state -->
	{#if loading}
		<div class="overflow-hidden rounded-lg bg-white px-4 py-12 text-center shadow">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-sm text-gray-500">Loading statistics...</p>
		</div>
	{:else if stats}
		<!-- Key metrics -->
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
				<dt class="truncate text-sm font-medium text-gray-500">Total Issues</dt>
				<dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
					{totalIssues}
				</dd>
			</div>

			<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
				<dt class="truncate text-sm font-medium text-gray-500">Completion Rate</dt>
				<dd class="mt-1 text-3xl font-semibold tracking-tight text-green-600">
					{getPercentage(stats.closed, totalIssues)}%
				</dd>
			</div>

			<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
				<dt class="truncate text-sm font-medium text-gray-500">Active</dt>
				<dd class="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
					{stats.in_progress}
				</dd>
			</div>

			<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
				<dt class="truncate text-sm font-medium text-gray-500">High Priority</dt>
				<dd class="mt-1 text-3xl font-semibold tracking-tight text-red-600">
					{stats.by_priority.P1 ?? 0}
				</dd>
			</div>
		</div>

		<!-- Charts grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Status distribution -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="text-lg font-medium text-gray-900">Status Distribution</h3>
				<div class="mt-4 space-y-4">
					{#each byStatus as item}
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-gray-700">{item.label}</span>
								<span class="text-gray-500">{item.count} ({getPercentage(item.count, totalIssues)}%)</span>
							</div>
							<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									class="{item.color} h-full transition-all duration-500"
									style="width: {getPercentage(item.count, totalIssues)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Priority distribution -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="text-lg font-medium text-gray-900">Priority Distribution</h3>
				<div class="mt-4 space-y-4">
					{#each byPriority as item}
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-gray-700">{item.label}</span>
								<span class="text-gray-500">{item.count} ({getPercentage(item.count, totalIssues)}%)</span>
							</div>
							<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									class="{item.color} h-full transition-all duration-500"
									style="width: {getPercentage(item.count, totalIssues)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Type distribution -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="text-lg font-medium text-gray-900">Type Distribution</h3>
				<div class="mt-4 space-y-4">
					{#each byType as item}
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-gray-700">{item.label}</span>
								<span class="text-gray-500">{item.count}</span>
							</div>
							<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									class="{item.color} h-full transition-all duration-500"
									style="width: {getPercentage(item.count, byType.reduce((s, i) => s + i.count, 0))}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Real-time updates indicator -->
			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="text-lg font-medium text-gray-900">Real-time Updates</h3>
				<div class="mt-4 flex items-center space-x-3">
					<div class="flex-shrink-0">
						{#if websocketService.connected}
							<div class="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
						{:else}
							<div class="h-3 w-3 rounded-full bg-gray-300"></div>
						{/if}
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">
							{websocketService.connected ? 'Connected' : 'Disconnected'}
						</p>
						<p class="text-xs text-gray-500">
							{websocketService.connected
								? 'Receiving live updates from beads daemon'
								: 'Attempting to reconnect...'}
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Charts placeholder note -->
	<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8">
		<div class="text-center">
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
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Interactive Charts Coming Soon</h3>
			<p class="mt-1 text-sm text-gray-500">
				Advanced visualizations and trend analysis will be added in the next phase
			</p>
		</div>
	</div>
</div>
