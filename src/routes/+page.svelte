<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchIssues, fetchStats } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import type { Issue, IssueStats } from '$lib/services/api';

	let issues = $state<Issue[]>([]);
	let stats = $state<IssueStats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let statusFilter = $state('');
	let priorityFilter = $state('');
	let searchQuery = $state('');

	async function loadData() {
		try {
			loading = true;
			error = null;
			const filters: { status?: string; priority?: string } = {};
			if (statusFilter) filters.status = statusFilter;
			if (priorityFilter) filters.priority = priorityFilter;

			const [fetchedIssues, fetchedStats] = await Promise.all([
				fetchIssues(filters),
				fetchStats()
			]);

			issues = fetchedIssues;
			stats = fetchedStats;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			console.error('Error loading data:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();

		// Listen for WebSocket mutations and reload data
		const handleMutations = () => {
			console.log('Mutations detected, reloading data...');
			loadData();
		};

		// Since websocketService uses runes, we can directly access mutations
		// but we need to set up a watcher
		$effect(() => {
			if (websocketService.mutations.length > 0) {
				handleMutations();
				websocketService.clearMutations();
			}
		});
	});

	// Filter issues by search query
	let filteredIssues = $derived(issues.filter((issue) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			issue.id.toLowerCase().includes(query) ||
			issue.title.toLowerCase().includes(query)
		);
	}));

	function getStatusColor(status: string): string {
		switch (status) {
			case 'open':
				return 'bg-blue-100 text-blue-800';
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-800';
			case 'closed':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'P1':
				return 'bg-red-100 text-red-800';
			case 'P2':
				return 'bg-orange-100 text-orange-800';
			case 'P3':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	async function applyFilters() {
		await loadData();
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Issue Overview</h1>
		<p class="mt-2 text-sm text-gray-700">
			Monitor and track all your beads issues in real-time
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
					<h3 class="text-sm font-medium text-red-800">Error loading data</h3>
					<div class="mt-2 text-sm text-red-700">
						<p>{error}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats cards -->
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
			<dt class="truncate text-sm font-medium text-gray-500">Total Issues</dt>
			<dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
				{loading ? '...' : stats?.total ?? 0}
			</dd>
		</div>

		<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
			<dt class="truncate text-sm font-medium text-gray-500">Open</dt>
			<dd class="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
				{loading ? '...' : stats?.open ?? 0}
			</dd>
		</div>

		<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
			<dt class="truncate text-sm font-medium text-gray-500">In Progress</dt>
			<dd class="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
				{loading ? '...' : stats?.in_progress ?? 0}
			</dd>
		</div>

		<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
			<dt class="truncate text-sm font-medium text-gray-500">Closed</dt>
			<dd class="mt-1 text-3xl font-semibold tracking-tight text-green-600">
				{loading ? '...' : stats?.closed ?? 0}
			</dd>
		</div>
	</div>

	<!-- Filters -->
	<div class="rounded-lg bg-white p-4 shadow">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div>
				<label for="status" class="block text-sm font-medium text-gray-700">Status</label>
				<select
					id="status"
					bind:value={statusFilter}
					onchange={applyFilters}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				>
					<option value="">All</option>
					<option value="open">Open</option>
					<option value="in_progress">In Progress</option>
					<option value="closed">Closed</option>
				</select>
			</div>

			<div>
				<label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
				<select
					id="priority"
					bind:value={priorityFilter}
					onchange={applyFilters}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				>
					<option value="">All</option>
					<option value="P1">P1</option>
					<option value="P2">P2</option>
					<option value="P3">P3</option>
				</select>
			</div>

			<div>
				<label for="search" class="block text-sm font-medium text-gray-700">Search</label>
				<input
					type="text"
					id="search"
					bind:value={searchQuery}
					placeholder="Search issues..."
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				/>
			</div>
		</div>
	</div>

	<!-- Issues list -->
	{#if loading}
		<div class="overflow-hidden rounded-lg bg-white px-4 py-12 text-center shadow">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-sm text-gray-500">Loading issues...</p>
		</div>
	{:else if filteredIssues.length === 0}
		<div class="rounded-lg bg-white px-4 py-12 text-center shadow">
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
			<h3 class="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
			<p class="mt-1 text-sm text-gray-500">
				{searchQuery || statusFilter || priorityFilter ? 'Try adjusting your filters.' : 'No issues to display.'}
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<ul role="list" class="divide-y divide-gray-200">
				{#each filteredIssues as issue}
					<li>
						<a
							href="/issues/{issue.id}"
							class="block transition hover:bg-gray-50"
						>
							<div class="px-4 py-4 sm:px-6">
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<p class="truncate text-sm font-medium text-blue-600">
											{issue.id}
										</p>
										<span
											class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getPriorityColor(
												issue.priority
											)}"
										>
											{issue.priority}
										</span>
										<span
											class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusColor(
												issue.status
											)}"
										>
											{issue.status.replace('_', ' ')}
										</span>
									</div>
								</div>
								<div class="mt-2">
									<p class="text-sm text-gray-900">
										{issue.title}
									</p>
								</div>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
