<script lang="ts">
	import { serverManager, type Server } from '$lib/services/servers.svelte';
	import { websocketService } from '$lib/services/websocket.svelte';

	let servers = $derived(serverManager.getAllServers());
	let activeServerId = $derived(serverManager.activeServerId);

	// Add server form state
	let showAddForm = $state(false);
	let newServerName = $state('');
	let newServerUrl = $state('');

	// Edit server state
	let editingServerId = $state<string | null>(null);
	let editServerName = $state('');
	let editServerUrl = $state('');

	function handleAddServer() {
		if (!newServerName.trim() || !newServerUrl.trim()) {
			alert('Please enter both name and URL');
			return;
		}

		try {
			// Validate URL
			new URL(newServerUrl);

			serverManager.addServer({
				name: newServerName.trim(),
				url: newServerUrl.trim(),
				active: false
			});

			// Reset form
			newServerName = '';
			newServerUrl = '';
			showAddForm = false;
		} catch (error) {
			alert('Invalid URL format. Please enter a valid URL (e.g., http://localhost:2325)');
		}
	}

	function handleSetActive(id: string) {
		serverManager.setActiveServer(id);
		// Reconnect WebSocket to new server
		websocketService.reconnect();
	}

	function handleRemoveServer(id: string) {
		if (confirm('Are you sure you want to remove this server?')) {
			serverManager.removeServer(id);
		}
	}

	function startEditServer(server: Server) {
		editingServerId = server.id;
		editServerName = server.name;
		editServerUrl = server.url;
	}

	function handleUpdateServer() {
		if (!editServerName.trim() || !editServerUrl.trim()) {
			alert('Please enter both name and URL');
			return;
		}

		try {
			// Validate URL
			new URL(editServerUrl);

			if (editingServerId) {
				serverManager.updateServer(editingServerId, {
					name: editServerName.trim(),
					url: editServerUrl.trim()
				});

				// If updating active server, reconnect
				if (editingServerId === activeServerId) {
					websocketService.reconnect();
				}
			}

			editingServerId = null;
			editServerName = '';
			editServerUrl = '';
		} catch (error) {
			alert('Invalid URL format. Please enter a valid URL (e.g., http://localhost:2325)');
		}
	}

	function cancelEdit() {
		editingServerId = null;
		editServerName = '';
		editServerUrl = '';
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
		<p class="mt-2 text-sm text-gray-700">
			Configure your monitoring servers and connection settings
		</p>
	</div>

	<!-- Servers management -->
	<div class="rounded-lg bg-white px-6 py-5 shadow">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-medium text-gray-900">Beads Servers</h2>
			<button
				type="button"
				onclick={() => (showAddForm = !showAddForm)}
				class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
			>
				{showAddForm ? 'Cancel' : 'Add Server'}
			</button>
		</div>

		<p class="mt-2 text-sm text-gray-500">
			Manage connections to multiple beads daemon instances
		</p>

		<!-- Add server form -->
		{#if showAddForm}
			<div class="mt-4 space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
				<div>
					<label for="newServerName" class="block text-sm font-medium text-gray-700">
						Server Name
					</label>
					<input
						type="text"
						id="newServerName"
						bind:value={newServerName}
						placeholder="My Project Server"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="newServerUrl" class="block text-sm font-medium text-gray-700">
						Server URL
					</label>
					<input
						type="url"
						id="newServerUrl"
						bind:value={newServerUrl}
						placeholder="http://localhost:2325"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					/>
					<p class="mt-1 text-xs text-gray-500">
						Full URL including protocol and port (e.g., http://localhost:2325)
					</p>
				</div>

				<div class="flex justify-end">
					<button
						type="button"
						onclick={handleAddServer}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
					>
						Add Server
					</button>
				</div>
			</div>
		{/if}

		<!-- Servers list -->
		<div class="mt-4 space-y-2">
			{#each servers as server}
				<div
					class="rounded-md border p-4 transition {server.active
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 bg-white'}"
				>
					{#if editingServerId === server.id}
						<!-- Edit mode -->
						<div class="space-y-3">
							<div>
								<label for="editServerName" class="block text-sm font-medium text-gray-700">
									Server Name
								</label>
								<input
									type="text"
									id="editServerName"
									bind:value={editServerName}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								/>
							</div>

							<div>
								<label for="editServerUrl" class="block text-sm font-medium text-gray-700">
									Server URL
								</label>
								<input
									type="url"
									id="editServerUrl"
									bind:value={editServerUrl}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								/>
							</div>

							<div class="flex justify-end space-x-2">
								<button
									type="button"
									onclick={cancelEdit}
									class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onclick={handleUpdateServer}
									class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
								>
									Save
								</button>
							</div>
						</div>
					{:else}
						<!-- View mode -->
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="flex items-center space-x-3">
									<h3 class="text-sm font-semibold text-gray-900">
										{server.name}
									</h3>
									{#if server.active}
										<span
											class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
										>
											Active
										</span>
									{/if}
								</div>
								<p class="mt-1 text-sm text-gray-500">{server.url}</p>
							</div>

							<div class="flex items-center space-x-2">
								{#if !server.active}
									<button
										type="button"
										onclick={() => handleSetActive(server.id)}
										class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
									>
										Set Active
									</button>
								{/if}
								<button
									type="button"
									onclick={() => startEditServer(server)}
									class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								>
									Edit
								</button>
								{#if servers.length > 1}
									<button
										type="button"
										onclick={() => handleRemoveServer(server.id)}
										class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
									>
										Remove
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- About -->
	<div class="rounded-lg bg-white px-6 py-5 shadow">
		<h2 class="text-lg font-medium text-gray-900">About</h2>
		<div class="mt-4 space-y-2 text-sm text-gray-600">
			<div class="flex justify-between">
				<span>Version:</span>
				<span class="font-medium text-gray-900">0.0.1</span>
			</div>
			<div class="flex justify-between">
				<span>Build:</span>
				<span class="font-medium text-gray-900">Development</span>
			</div>
			<div class="flex justify-between">
				<span>Framework:</span>
				<span class="font-medium text-gray-900">SvelteKit + Koa</span>
			</div>
		</div>
	</div>
</div>
