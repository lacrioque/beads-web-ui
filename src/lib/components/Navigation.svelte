<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fetchConnectionStatus } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';
	import { serverManager } from '$lib/services/servers.svelte';
	import { Badge } from '$lib/components';

	const navItems = [
		{ href: '/', label: 'Overview', icon: '📊' },
		{ href: '/statistics', label: 'Statistics', icon: '📈' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];

	let apiConnected = $state(false);
	let serverDropdownOpen = $state(false);

	let activeServer = $derived(serverManager.getActiveServer());
	let allServers = $derived(serverManager.getAllServers());

	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	function handleServerSwitch(serverId: string) {
		if (serverId !== serverManager.activeServerId) {
			serverManager.setActiveServer(serverId);
			websocketService.reconnect();
			// Recheck API connection with new server
			checkApiConnection();
		}
		serverDropdownOpen = false;
	}

	function toggleServerDropdown() {
		serverDropdownOpen = !serverDropdownOpen;
	}

	async function checkApiConnection() {
		try {
			const status = await fetchConnectionStatus();
			apiConnected = status.connected;
		} catch (error) {
			apiConnected = false;
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (serverDropdownOpen) {
			const target = event.target as HTMLElement;
			const dropdown = document.getElementById('server-dropdown');
			const button = document.getElementById('server-dropdown-button');
			if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
				serverDropdownOpen = false;
			}
		}
	}

	onMount(() => {
		checkApiConnection();
		// Check API connection every 30 seconds
		const interval = setInterval(checkApiConnection, 30000);

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			clearInterval(interval);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<nav class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<div class="flex flex-shrink-0 items-center">
					<h1 class="text-xl font-bold text-gray-900">Beads Monitor</h1>
				</div>
				<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
					{#each navItems as item}
						<a
							href={item.href}
							class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors
								{isActive(item.href)
								? 'border-blue-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							<span class="mr-2">{item.icon}</span>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
			<div class="flex items-center">
				<div class="flex items-center space-x-4 text-sm">
					<!-- Server Switcher Dropdown -->
					<div class="relative">
						<button
							id="server-dropdown-button"
							type="button"
							onclick={toggleServerDropdown}
							class="flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
							title="Switch server"
						>
							<span class="hidden sm:inline">🖥️</span>
							<span class="max-w-32 truncate">{activeServer?.name || 'No Server'}</span>
							<span class="text-gray-400">▼</span>
						</button>

						{#if serverDropdownOpen}
							<div
								id="server-dropdown"
								class="ring-opacity-5 absolute right-0 z-50 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black"
							>
								<div class="py-1">
									{#each allServers as server}
										<button
											type="button"
											onclick={() => handleServerSwitch(server.id)}
											class="flex w-full items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-gray-100 {server.active
												? 'bg-blue-50'
												: ''}"
										>
											<div class="flex-1 text-left">
												<div class="font-medium text-gray-900">{server.name}</div>
												<div class="truncate text-xs text-gray-500">{server.url}</div>
											</div>
											{#if server.active}
												<Badge class="ml-2 bg-blue-100 text-blue-800">Active</Badge>
											{/if}
										</button>
									{/each}
									<div class="border-t border-gray-100 pt-1">
										<a
											href="/settings"
											class="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
											onclick={() => (serverDropdownOpen = false)}
										>
											⚙️ Manage Servers
										</a>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- API Connection Status -->
					<div
						class="flex items-center space-x-2"
						title={apiConnected ? 'Connected to beads daemon' : 'Disconnected from daemon'}
					>
						<div class="h-2 w-2 rounded-full {apiConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
						<span class="hidden text-gray-500 sm:inline">API</span>
					</div>
					<!-- WebSocket Connection Status -->
					<div
						class="flex items-center space-x-2"
						title={websocketService.connected ? 'WebSocket connected' : 'WebSocket disconnected'}
					>
						<div
							class="h-2 w-2 rounded-full {websocketService.connected
								? 'animate-pulse bg-green-500'
								: 'bg-gray-400'}"
						></div>
						<span class="hidden text-gray-500 sm:inline">WS</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile menu -->
	<div class="sm:hidden">
		<div class="space-y-1 pt-2 pb-3">
			<!-- Mobile Server Selector -->
			<div class="border-b border-gray-200 px-3 pb-3">
				<div class="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">Server</div>
				{#each allServers as server}
					<button
						type="button"
						onclick={() => handleServerSwitch(server.id)}
						class="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors {server.active
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-700 hover:bg-gray-50'}"
					>
						<div class="flex-1 text-left">
							<div class="font-medium">{server.name}</div>
							<div class="truncate text-xs opacity-75">{server.url}</div>
						</div>
						{#if server.active}
							<Badge class="ml-2 bg-blue-100 text-blue-800">Active</Badge>
						{/if}
					</button>
				{/each}
			</div>

			{#each navItems as item}
				<a
					href={item.href}
					class="block border-l-4 py-2 pr-4 pl-3 text-base font-medium transition-colors
						{isActive(item.href)
						? 'border-blue-500 bg-blue-50 text-blue-700'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'}"
				>
					<span class="mr-2">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</div>
	</div>
</nav>
