<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fetchIssue } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription,
		StatusBadge,
		PriorityBadge,
		Badge,
		LoadingSkeleton,
		Separator
	} from '$lib/components';
	import type { Issue } from '$lib/services/api';

	let issueId = $derived($page.params.id);

	let issue = $state<Issue | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadIssue() {
		if (!issueId) {
			error = 'No issue ID provided';
			loading = false;
			return;
		}

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
				const relevantMutations = websocketService.mutations.filter((m) => m.issue_id === issueId);
				if (relevantMutations.length > 0) {
					console.log('Issue updated via WebSocket, reloading...');
					loadIssue();
				}
				websocketService.clearMutations();
			}
		});
	});

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<div class="space-y-6">
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
						<h3 class="text-sm font-medium text-red-800">Error loading issue</h3>
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
		<LoadingSkeleton type="card" count={1} />
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<LoadingSkeleton type="card" count={2} />
			</div>
			<div>
				<LoadingSkeleton type="card" count={2} />
			</div>
		</div>
	{:else if issue}
		<!-- Breadcrumb -->
		<nav class="flex" aria-label="Breadcrumb">
			<ol role="list" class="flex items-center space-x-2">
				<li>
					<a href="/" class="text-gray-400 hover:text-gray-500">
						<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
		<Card>
			<CardHeader>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<PriorityBadge priority={issue.priority} />
							<StatusBadge status={issue.status} />
							{#if issue.type}
								<Badge variant="secondary" class="bg-purple-100 text-purple-800">
									{issue.type}
								</Badge>
							{/if}
						</div>
						<CardTitle class="text-2xl">{issue.title}</CardTitle>
						<CardDescription class="mt-1">{issue.id}</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
			</CardContent>
		</Card>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Description -->
				<Card>
					<CardHeader>
						<CardTitle>Description</CardTitle>
					</CardHeader>
					<CardContent>
						{#if issue.description}
							<div class="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
								{issue.description}
							</div>
						{:else}
							<p class="text-sm text-gray-500 italic">No description provided</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Labels -->
				{#if issue.labels && issue.labels.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Labels</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex flex-wrap gap-2">
								{#each issue.labels as label}
									<Badge variant="outline" class="bg-blue-50">
										{label}
									</Badge>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Dependencies -->
				{#if issue.dependencies && issue.dependencies.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Dependencies</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								{#each issue.dependencies as depId}
									<a
										href="/issues/{depId}"
										class="block rounded-md border border-gray-200 p-3 transition hover:border-gray-300 hover:bg-gray-50"
									>
										<span class="text-sm font-medium text-blue-600">{depId}</span>
									</a>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Metadata -->
				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent>
						<dl class="space-y-3">
							{#if issue.assignee}
								<div>
									<dt class="text-sm font-medium text-gray-500">Assignee</dt>
									<dd class="mt-1 text-sm text-gray-900">{issue.assignee}</dd>
								</div>
								<Separator />
							{/if}
							<div>
								<dt class="text-sm font-medium text-gray-500">Created</dt>
								<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.created)}</dd>
							</div>
							<Separator />
							<div>
								<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
								<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.updated)}</dd>
							</div>
							{#if issue.closed}
								<Separator />
								<div>
									<dt class="text-sm font-medium text-gray-500">Closed</dt>
									<dd class="mt-1 text-sm text-gray-900">{formatDate(issue.closed)}</dd>
								</div>
							{/if}
						</dl>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>
