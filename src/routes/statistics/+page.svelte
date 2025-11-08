<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchStats } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		StatCard,
		LoadingSkeleton
	} from '$lib/components';
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
	let byStatus = $derived(
		stats
			? [
					{ label: 'Open', count: stats.open, color: 'bg-blue-500' },
					{ label: 'In Progress', count: stats.in_progress, color: 'bg-yellow-500' },
					{ label: 'Closed', count: stats.closed, color: 'bg-green-500' }
				]
			: []
	);

	let byPriority = $derived(
		stats
			? Object.entries(stats.by_priority).map(([label, count]) => ({
					label,
					count,
					color: label === 'P1' ? 'bg-red-500' : label === 'P2' ? 'bg-orange-500' : 'bg-yellow-500'
				}))
			: []
	);

	let byType = $derived(
		stats
			? Object.entries(stats.by_type).map(([label, count]) => ({
					label,
					count,
					color:
						label === 'epic' ? 'bg-purple-500' : label === 'task' ? 'bg-blue-500' : 'bg-red-500'
				}))
			: []
	);

	let totalIssues = $derived(stats?.total ?? 0);
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Statistics</h1>
		<p class="mt-2 text-sm text-gray-700">Detailed insights and metrics about your issues</p>
	</div>

	<!-- Error state -->
	{#if error}
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
						<h3 class="text-sm font-medium text-red-800">Error loading statistics</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{error}</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Loading state -->
	{#if loading}
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<LoadingSkeleton type="stat" count={4} />
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<LoadingSkeleton type="card" count={4} />
		</div>
	{:else if stats}
		<!-- Key metrics -->
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard label="Total Issues" value={totalIssues} />
			<StatCard
				label="Completion Rate"
				value="{getPercentage(stats.closed, totalIssues)}%"
				colorClass="text-green-600"
			/>
			<StatCard label="Active" value={stats.in_progress} colorClass="text-yellow-600" />
			<StatCard label="High Priority" value={stats.by_priority.P1 ?? 0} colorClass="text-red-600" />
		</div>

		<!-- Charts grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Status distribution -->
			<Card>
				<CardHeader>
					<CardTitle>Status Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#each byStatus as item}
							<div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700">{item.label}</span>
									<span class="text-gray-500"
										>{item.count} ({getPercentage(item.count, totalIssues)}%)</span
									>
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
				</CardContent>
			</Card>

			<!-- Priority distribution -->
			<Card>
				<CardHeader>
					<CardTitle>Priority Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#each byPriority as item}
							<div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700">{item.label}</span>
									<span class="text-gray-500"
										>{item.count} ({getPercentage(item.count, totalIssues)}%)</span
									>
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
				</CardContent>
			</Card>

			<!-- Type distribution -->
			<Card>
				<CardHeader>
					<CardTitle>Type Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#each byType as item}
							<div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700 capitalize">{item.label}</span>
									<span class="text-gray-500">{item.count}</span>
								</div>
								<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
									<div
										class="{item.color} h-full transition-all duration-500"
										style="width: {getPercentage(
											item.count,
											byType.reduce((s, i) => s + i.count, 0)
										)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Real-time updates indicator -->
			<Card>
				<CardHeader>
					<CardTitle>Real-time Updates</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex items-center space-x-3">
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
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
