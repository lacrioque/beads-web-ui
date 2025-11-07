<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fetchIssue } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import type { Issue } from '$lib/services/api';

	const issueId = $page.params.id;

	let issue = $state<Issue | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadIssue() {
		try {
			loading = true;
			error = null;
			issue = await fetchIssue(issueId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load issue';
			console.error('Error loading issue:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadIssue();

		// Listen for WebSocket mutations and reload issue
		$effect(() => {
			if (websocketService.mutations.length > 0) {
				const relevantMutations = websocketService.mutations.filter(
					(m) => m.issue_id === issueId
				);
				if (relevantMutations.length > 0) {
					console.log('Issue updated via WebSocket, reloading...');
					loadIssue();
				}
				websocketService.clearMutations();
			}
		});
	});

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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<div class="space-y-6">
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
					<h3 class="text-sm font-medium text-red-800">Error loading issue</h3>
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
			<p class="mt-4 text-sm text-gray-500">Loading issue...</p>
		</div>
	{:else if issue}
		<!-- Breadcrumb -->
		<nav class="flex" aria-label="Breadcrumb">
			<ol role="list" class="flex items-center space-x-2">
				<li>
					<a href="/" class="text-gray-400 hover:text-gray-500">
						<svg
							class="h-5 w-5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
							/>
						</svg>
						<span class="sr-only">Home</span>
					</a>
				</li>
				<li>
					<div class="flex items-center">
						<svg
							class="h-5 w-5 flex-shrink-0 text-gray-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="ml-2 text-sm font-medium text-gray-500">
							{issue.id}
						</span>
					</div>
				</li>
			</ol>
		</nav>

		<!-- Issue header -->
	<div class="rounded-lg bg-white px-6 py-5 shadow">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="flex items-center space-x-2">
					<span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getPriorityColor(issue.priority)}">
						{issue.priority}
					</span>
					<span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusColor(issue.status)}">
						{issue.status.replace('_', ' ')}
					</span>
					{#if issue.type}
						<span class="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
							{issue.type}
						</span>
					{/if}
				</div>
				<h1 class="mt-2 text-2xl font-bold text-gray-900">
					{issue.title}
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					{issue.id}
				</p>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-3">
			<div>
				<dt class="text-sm font-medium text-gray-500">Created</dt>
				<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.created)}</dd>
			</div>
			<div>
				<dt class="text-sm font-medium text-gray-500">Updated</dt>
				<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.updated)}</dd>
			</div>
			{#if issue.closed}
				<div>
					<dt class="text-sm font-medium text-gray-500">Closed</dt>
					<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.closed)}</dd>
				</div>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main content -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Description -->
			<div class="rounded-lg bg-white px-6 py-5 shadow">
				<h2 class="text-lg font-medium text-gray-900">Description</h2>
				{#if issue.description}
					<div class="prose prose-sm mt-4 max-w-none text-gray-700 whitespace-pre-wrap">
						{issue.description}
					</div>
				{:else}
					<p class="mt-4 text-sm text-gray-500 italic">No description provided</p>
				{/if}
			</div>

			<!-- Labels -->
			{#if issue.labels && issue.labels.length > 0}
				<div class="rounded-lg bg-white px-6 py-5 shadow">
					<h2 class="text-lg font-medium text-gray-900">Labels</h2>
					<div class="mt-4 flex flex-wrap gap-2">
						{#each issue.labels as label}
							<span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
								{label}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Dependencies -->
			{#if issue.dependencies && issue.dependencies.length > 0}
				<div class="rounded-lg bg-white px-6 py-5 shadow">
					<h2 class="text-lg font-medium text-gray-900">Dependencies</h2>
					<div class="mt-4 space-y-2">
						{#each issue.dependencies as depId}
							<a
								href="/issues/{depId}"
								class="block rounded-md border border-gray-200 p-3 transition hover:bg-gray-50"
							>
								<span class="text-sm font-medium text-blue-600">{depId}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Metadata -->
			<div class="rounded-lg bg-white px-6 py-5 shadow">
				<h2 class="text-lg font-medium text-gray-900">Details</h2>
				<dl class="mt-4 space-y-3">
					{#if issue.assignee}
						<div>
							<dt class="text-sm font-medium text-gray-500">Assignee</dt>
							<dd class="mt-1 text-sm text-gray-900">{issue.assignee}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-sm font-medium text-gray-500">Created</dt>
						<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.created)}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
						<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.updated)}</dd>
					</div>
					{#if issue.closed}
						<div>
							<dt class="text-sm font-medium text-gray-500">Closed</dt>
							<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.closed)}</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>
	</div>
	{/if}
</div>
