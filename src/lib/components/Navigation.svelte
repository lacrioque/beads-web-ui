<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fetchConnectionStatus } from '$lib/services/api';
	import { websocketService } from '$lib/services/websocket.svelte';

	const navItems = [
		{ href: '/', label: 'Overview', icon: '📊' },
		{ href: '/statistics', label: 'Statistics', icon: '📈' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];

	let apiConnected = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	async function checkApiConnection() {
		try {
			const status = await fetchConnectionStatus();
			apiConnected = status.connected;
		} catch (error) {
			apiConnected = false;
		}
	}

	onMount(() => {
		checkApiConnection();
		// Check API connection every 30 seconds
		const interval = setInterval(checkApiConnection, 30000);
		return () => clearInterval(interval);
	});
</script>

<nav class="bg-white shadow-sm border-b border-gray-200">
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
					<!-- API Connection Status -->
					<div class="flex items-center space-x-2" title="{apiConnected ? 'Connected to beads daemon' : 'Disconnected from daemon'}">
						<div class="h-2 w-2 rounded-full {apiConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
						<span class="text-gray-500 hidden sm:inline">API</span>
					</div>
					<!-- WebSocket Connection Status -->
					<div class="flex items-center space-x-2" title="{websocketService.connected ? 'WebSocket connected' : 'WebSocket disconnected'}">
						<div class="h-2 w-2 rounded-full {websocketService.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"></div>
						<span class="text-gray-500 hidden sm:inline">WS</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile menu -->
	<div class="sm:hidden">
		<div class="space-y-1 pb-3 pt-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors
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
