<script lang="ts">
	import { page } from '$app/stores';

	const errorCode = $page.status;
	const errorMessage = $page.error?.message || 'An unexpected error occurred';

	function getErrorTitle(code: number): string {
		switch (code) {
			case 404:
				return 'Page Not Found';
			case 500:
				return 'Internal Server Error';
			case 403:
				return 'Forbidden';
			case 401:
				return 'Unauthorized';
			default:
				return 'Error';
		}
	}

	function getErrorDescription(code: number): string {
		switch (code) {
			case 404:
				return "The page you're looking for doesn't exist or has been moved.";
			case 500:
				return 'Something went wrong on our end. Please try again later.';
			case 403:
				return "You don't have permission to access this resource.";
			case 401:
				return 'You need to be authenticated to access this resource.';
			default:
				return 'Something unexpected happened.';
		}
	}

	function getErrorIcon(code: number): string {
		switch (code) {
			case 404:
				return 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			case 500:
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
			case 403:
			case 401:
				return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
			default:
				return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

<svelte:head>
	<title>{errorCode} - {getErrorTitle(errorCode)} | Beads Monitor</title>
</svelte:head>

<div class="flex min-h-full flex-col bg-white pt-16 pb-12">
	<main
		class="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8"
	>
		<div class="flex flex-shrink-0 justify-center">
			<a href="/" class="inline-flex">
				<span class="text-2xl font-bold text-blue-600">Beads Monitor</span>
			</a>
		</div>
		<div class="py-16">
			<div class="text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={getErrorIcon(errorCode)}
					/>
				</svg>
				<p class="mt-2 text-base font-semibold text-blue-600">
					{errorCode}
				</p>
				<h1 class="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
					{getErrorTitle(errorCode)}
				</h1>
				<p class="mt-2 text-base text-gray-500">
					{getErrorDescription(errorCode)}
				</p>
				{#if errorMessage && errorMessage !== 'Not found'}
					<p class="mt-2 text-sm text-gray-400">
						{errorMessage}
					</p>
				{/if}
				<div class="mt-6 flex items-center justify-center gap-x-6">
					<a
						href="/"
						class="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
					>
						Go back home
					</a>
					<button onclick={() => window.history.back()} class="text-sm font-semibold text-gray-900">
						Go back <span aria-hidden="true">&rarr;</span>
					</button>
				</div>
			</div>
		</div>
	</main>
	<footer class="mx-auto w-full max-w-7xl flex-shrink-0 px-4 sm:px-6 lg:px-8">
		<nav class="flex justify-center space-x-4">
			<a href="/" class="text-sm font-medium text-gray-500 hover:text-gray-600"> Overview </a>
			<span class="inline-block border-l border-gray-300" aria-hidden="true"></span>
			<a href="/statistics" class="text-sm font-medium text-gray-500 hover:text-gray-600">
				Statistics
			</a>
			<span class="inline-block border-l border-gray-300" aria-hidden="true"></span>
			<a href="/settings" class="text-sm font-medium text-gray-500 hover:text-gray-600">
				Settings
			</a>
		</nav>
	</footer>
</div>
