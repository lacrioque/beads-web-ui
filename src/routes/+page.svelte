<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fetchIssues, fetchStats } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import {
		IssueCard,
		EpicCard,
		StatCard,
		LoadingSkeleton,
		Input,
		Card,
		CardContent
	} from '$lib/components';
	import type { Issue, IssueStats } from '$lib/services/api';

	let issues = $state<Issue[]>([]);
	let stats = $state<IssueStats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let statusFilter = $state('');
	let priorityFilter = $state('');
	let typeFilter = $state('');
	let parentFilter = $state('');
	let searchQuery = $state('');

	async function loadData() {
		try {
			loading = true;
			error = null;
			const filters: { status?: string; priority?: string; type?: string; parent?: string } = {};
			if (statusFilter) filters.status = statusFilter;
			if (priorityFilter) filters.priority = priorityFilter;
			if (typeFilter) filters.type = typeFilter;
			if (parentFilter) filters.parent = parentFilter;

			const [fetchedIssues, fetchedStats] = await Promise.all([fetchIssues(filters), fetchStats()]);

			issues = fetchedIssues;
			stats = fetchedStats;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			console.error('Error loading data:', err);
		} finally {
			loading = false;
		}
	}

	// Get list of epics for parent filter
	let availableEpics = $derived(issues.filter((issue) => issue.issue_type === 'epic'));

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

	// Filter issues by search query and separate epics from regular issues
	let filteredIssues = $derived(
		issues.filter((issue) => {
			if (!searchQuery) return true;
			const query = searchQuery.toLowerCase();
			return issue.id.toLowerCase().includes(query) || issue.title.toLowerCase().includes(query);
		})
	);

	let epics = $derived(filteredIssues.filter((issue) => issue.issue_type === 'epic'));
	let regularIssues = $derived(filteredIssues.filter((issue) => issue.issue_type !== 'epic'));

	async function applyFilters() {
		await loadData();
	}

	function navigateToIssue(issueId: string) {
		goto(`/issues/${issueId}`);
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Issue Overview</h1>
		<p class="mt-2 text-sm text-gray-700">Monitor and track all your beads issues in real-time</p>
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
						<h3 class="text-sm font-medium text-red-800">Error loading data</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{error}</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Stats cards -->
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#if loading}
			<LoadingSkeleton type="stat" count={4} />
		{:else}
			<StatCard label="Total Issues" value={stats?.total ?? 0} />
			<StatCard label="Open" value={stats?.open ?? 0} colorClass="text-blue-600" />
			<StatCard label="In Progress" value={stats?.in_progress ?? 0} colorClass="text-yellow-600" />
			<StatCard label="Closed" value={stats?.closed ?? 0} colorClass="text-green-600" />
		{/if}
	</div>

	<!-- Filters -->
	<Card>
		<CardContent class="pt-6">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div>
					<label for="status" class="mb-2 block text-sm font-medium text-gray-700">Status</label>
					<select
						id="status"
						bind:value={statusFilter}
						onchange={applyFilters}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					>
						<option value="">All</option>
						<option value="open">Open</option>
						<option value="in_progress">In Progress</option>
						<option value="closed">Closed</option>
					</select>
				</div>

				<div>
					<label for="priority" class="mb-2 block text-sm font-medium text-gray-700">Priority</label
					>
					<select
						id="priority"
						bind:value={priorityFilter}
						onchange={applyFilters}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					>
						<option value="">All</option>
						<option value="P1">P1</option>
						<option value="P2">P2</option>
						<option value="P3">P3</option>
					</select>
				</div>

				<div>
					<label for="type" class="mb-2 block text-sm font-medium text-gray-700">Type</label>
					<select
						id="type"
						bind:value={typeFilter}
						onchange={applyFilters}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					>
						<option value="">All</option>
						<option value="epic">Epic</option>
						<option value="task">Task</option>
						<option value="bug">Bug</option>
					</select>
				</div>

				<div>
					<label for="parent" class="mb-2 block text-sm font-medium text-gray-700"
						>Parent Epic</label
					>
					<select
						id="parent"
						bind:value={parentFilter}
						onchange={applyFilters}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					>
						<option value="">All (no parent filter)</option>
						{#each availableEpics as epic (epic.id)}
							<option value={epic.id}>{epic.id} - {epic.title}</option>
						{/each}
					</select>
				</div>

				<div class="sm:col-span-2 lg:col-span-2">
					<label for="search" class="mb-2 block text-sm font-medium text-gray-700">Search</label>
					<Input type="text" id="search" bind:value={searchQuery} placeholder="Search issues..." />
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Issues list -->
	{#if loading}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<LoadingSkeleton type="card" count={6} />
		</div>
	{:else if filteredIssues.length === 0}
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
				<h3 class="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
				<p class="mt-1 text-sm text-gray-500">
					{searchQuery || statusFilter || priorityFilter
						? 'Try adjusting your filters.'
						: 'No issues to display.'}
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-6">
			<!-- Epics section -->
			{#if epics.length > 0}
				<div class="space-y-3">
					<h2 class="text-lg font-semibold text-gray-900">Epics</h2>
					<div class="grid grid-cols-1 gap-4">
						{#each epics as epic (epic.id)}
							<EpicCard {epic} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- Regular issues section -->
			{#if regularIssues.length > 0}
				<div class="space-y-3">
					{#if epics.length > 0}
						<h2 class="text-lg font-semibold text-gray-900">Issues</h2>
					{/if}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each regularIssues as issue (issue.id)}
							<IssueCard {issue} onclick={() => navigateToIssue(issue.id)} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
