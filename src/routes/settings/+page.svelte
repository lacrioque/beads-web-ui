<script lang="ts">
	import { serverManager, type Server } from '$lib/services/servers.svelte';
	import { websocketService } from '$lib/services/websocket.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription,
		Button,
		Input,
		Badge,
		Separator
	} from '$lib/components';

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
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Beads Servers</CardTitle>
					<CardDescription class="mt-1.5">
						Manage connections to multiple beads daemon instances
					</CardDescription>
				</div>
				<Button onclick={() => (showAddForm = !showAddForm)}>
					{showAddForm ? 'Cancel' : 'Add Server'}
				</Button>
			</div>
		</CardHeader>

		<CardContent>
			<!-- Add server form -->
			{#if showAddForm}
				<Card class="mb-4 border-blue-200 bg-blue-50">
					<CardContent class="pt-6">
						<div class="space-y-4">
							<div>
								<label for="newServerName" class="mb-2 block text-sm font-medium text-gray-700">
									Server Name
								</label>
								<Input
									type="text"
									id="newServerName"
									bind:value={newServerName}
									placeholder="My Project Server"
								/>
							</div>

							<div>
								<label for="newServerUrl" class="mb-2 block text-sm font-medium text-gray-700">
									Server URL
								</label>
								<Input
									type="url"
									id="newServerUrl"
									bind:value={newServerUrl}
									placeholder="http://localhost:2325"
								/>
								<p class="mt-1 text-xs text-gray-500">
									Full URL including protocol and port (e.g., http://localhost:2325)
								</p>
							</div>

							<div class="flex justify-end">
								<Button onclick={handleAddServer}>Add Server</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Servers list -->
			<div class="space-y-3">
				{#each servers as server, index (server.id)}
					<Card class={server.active ? 'border-blue-500 bg-blue-50/50' : ''}>
						<CardContent class="pt-6">
							{#if editingServerId === server.id}
								<!-- Edit mode -->
								<div class="space-y-4">
									<div>
										<label
											for="editServerName"
											class="mb-2 block text-sm font-medium text-gray-700"
										>
											Server Name
										</label>
										<Input type="text" id="editServerName" bind:value={editServerName} />
									</div>

									<div>
										<label for="editServerUrl" class="mb-2 block text-sm font-medium text-gray-700">
											Server URL
										</label>
										<Input type="url" id="editServerUrl" bind:value={editServerUrl} />
									</div>

									<div class="flex justify-end space-x-2">
										<Button variant="outline" onclick={cancelEdit}>Cancel</Button>
										<Button onclick={handleUpdateServer}>Save</Button>
									</div>
								</div>
							{:else}
								<!-- View mode -->
								<div class="flex items-center justify-between">
									<div class="min-w-0 flex-1">
										<div class="flex items-center space-x-3">
											<h3 class="text-base font-semibold text-gray-900">
												{server.name}
											</h3>
											{#if server.active}
												<Badge class="bg-blue-100 text-blue-800">Active</Badge>
											{/if}
										</div>
										<p class="mt-1 truncate text-sm text-gray-500">{server.url}</p>
									</div>

									<div class="flex flex-shrink-0 items-center space-x-2">
										{#if !server.active}
											<Button
												variant="outline"
												size="sm"
												onclick={() => handleSetActive(server.id)}
											>
												Set Active
											</Button>
										{/if}
										<Button variant="outline" size="sm" onclick={() => startEditServer(server)}>
											Edit
										</Button>
										{#if servers.length > 1}
											<Button
												variant="outline"
												size="sm"
												class="text-red-600 hover:bg-red-50 hover:text-red-700"
												onclick={() => handleRemoveServer(server.id)}
											>
												Remove
											</Button>
										{/if}
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- About -->
	<Card>
		<CardHeader>
			<CardTitle>About</CardTitle>
		</CardHeader>
		<CardContent>
			<dl class="space-y-3 text-sm">
				<div class="flex justify-between">
					<dt class="text-gray-600">Version:</dt>
					<dd class="font-medium text-gray-900">0.0.1</dd>
				</div>
				<Separator />
				<div class="flex justify-between">
					<dt class="text-gray-600">Build:</dt>
					<dd class="font-medium text-gray-900">Development</dd>
				</div>
				<Separator />
				<div class="flex justify-between">
					<dt class="text-gray-600">Framework:</dt>
					<dd class="font-medium text-gray-900">SvelteKit + Koa</dd>
				</div>
			</dl>
		</CardContent>
	</Card>
</div>
