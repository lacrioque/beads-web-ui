<script lang="ts">
	// Settings page
	// Configuration options for the monitoring application

	let settings = $state({
		refreshInterval: 5,
		notifications: true,
		darkMode: false,
		daemonSocket: '/tmp/beads-daemon.sock',
		autoReconnect: true,
		showClosedIssues: false,
		itemsPerPage: 25
	});

	function handleSave() {
		// In a real implementation, this would save to local storage or backend
		alert('Settings saved successfully!');
	}

	function handleReset() {
		settings = {
			refreshInterval: 5,
			notifications: true,
			darkMode: false,
			daemonSocket: '/tmp/beads-daemon.sock',
			autoReconnect: true,
			showClosedIssues: false,
			itemsPerPage: 25
		};
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
		<p class="mt-2 text-sm text-gray-700">
			Configure your monitoring preferences and connection settings
		</p>
	</div>

	<!-- Settings form -->
	<div class="space-y-6">
		<!-- Connection settings -->
		<div class="rounded-lg bg-white px-6 py-5 shadow">
			<h2 class="text-lg font-medium text-gray-900">Connection</h2>
			<div class="mt-4 space-y-4">
				<div>
					<label for="socket" class="block text-sm font-medium text-gray-700">
						Daemon Socket Path
					</label>
					<input
						type="text"
						id="socket"
						bind:value={settings.daemonSocket}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					/>
					<p class="mt-1 text-sm text-gray-500">
						Path to the beads daemon Unix socket
					</p>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="autoReconnect"
						bind:checked={settings.autoReconnect}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="autoReconnect" class="ml-2 block text-sm text-gray-900">
						Automatically reconnect when disconnected
					</label>
				</div>
			</div>
		</div>

		<!-- Display settings -->
		<div class="rounded-lg bg-white px-6 py-5 shadow">
			<h2 class="text-lg font-medium text-gray-900">Display</h2>
			<div class="mt-4 space-y-4">
				<div>
					<label for="refreshInterval" class="block text-sm font-medium text-gray-700">
						Refresh Interval (seconds)
					</label>
					<input
						type="number"
						id="refreshInterval"
						bind:value={settings.refreshInterval}
						min="1"
						max="60"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					/>
					<p class="mt-1 text-sm text-gray-500">
						How often to poll for updates from the daemon
					</p>
				</div>

				<div>
					<label for="itemsPerPage" class="block text-sm font-medium text-gray-700">
						Items Per Page
					</label>
					<select
						id="itemsPerPage"
						bind:value={settings.itemsPerPage}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
					<p class="mt-1 text-sm text-gray-500">
						Number of issues to display per page
					</p>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="showClosed"
						bind:checked={settings.showClosedIssues}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="showClosed" class="ml-2 block text-sm text-gray-900">
						Show closed issues by default
					</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="darkMode"
						bind:checked={settings.darkMode}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="darkMode" class="ml-2 block text-sm text-gray-900">
						Dark mode (coming soon)
					</label>
				</div>
			</div>
		</div>

		<!-- Notification settings -->
		<div class="rounded-lg bg-white px-6 py-5 shadow">
			<h2 class="text-lg font-medium text-gray-900">Notifications</h2>
			<div class="mt-4 space-y-4">
				<div class="flex items-center">
					<input
						type="checkbox"
						id="notifications"
						bind:checked={settings.notifications}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="notifications" class="ml-2 block text-sm text-gray-900">
						Enable browser notifications
					</label>
				</div>

				<p class="text-sm text-gray-500">
					Receive notifications for important issue updates
				</p>
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

	<!-- Action buttons -->
	<div class="flex justify-end space-x-3">
		<button
			type="button"
			onclick={handleReset}
			class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
		>
			Reset to Defaults
		</button>
		<button
			type="button"
			onclick={handleSave}
			class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
		>
			Save Settings
		</button>
	</div>
</div>
