/**
 * Mutation event poller
 * Polls the beads daemon for mutation events and triggers broadcasts
 */

import { EventEmitter } from 'events';
import { getRPCClient } from '../rpc/connection-manager.js';
import type { MutationEvent } from '../rpc/client.js';

export interface MutationPollerOptions {
	pollInterval: number; // milliseconds
}

/**
 * Mutation event poller
 */
export class MutationPoller extends EventEmitter {
	private pollInterval: NodeJS.Timeout | null = null;
	private lastEventId = 0;
	private isPolling = false;
	private options: MutationPollerOptions;

	constructor(options: MutationPollerOptions = { pollInterval: 2000 }) {
		super();
		this.options = options;
	}

	/**
	 * Start polling for mutations
	 */
	start(): void {
		if (this.isPolling) {
			console.warn('Mutation poller is already running');
			return;
		}

		this.isPolling = true;
		console.log(`✓ Started mutation polling (interval: ${this.options.pollInterval}ms)`);

		// Poll immediately on start
		this.poll();

		// Then poll at regular intervals
		this.pollInterval = setInterval(() => {
			this.poll();
		}, this.options.pollInterval);
	}

	/**
	 * Poll for new mutations
	 */
	private async poll(): Promise<void> {
		try {
			const client = getRPCClient();

			if (!client.isConnected()) {
				// Skip polling if not connected
				return;
			}

			const mutations = await client.getMutations(this.lastEventId);

			if (mutations.length > 0) {
				console.log(`Found ${mutations.length} new mutation(s)`);

				// Update last event ID
				const maxId = Math.max(...mutations.map((m) => m.id));
				if (maxId > this.lastEventId) {
					this.lastEventId = maxId;
				}

				// Emit mutations event
				this.emit('mutations', mutations);

				// Emit individual events for each mutation
				for (const mutation of mutations) {
					this.emit('mutation', mutation);
				}
			}
		} catch (error) {
			console.error('Error polling for mutations:', error);
			// Don't stop polling on error, just log it
		}
	}

	/**
	 * Stop polling
	 */
	stop(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}

		this.isPolling = false;
		console.log('Stopped mutation polling');
	}

	/**
	 * Check if currently polling
	 */
	isRunning(): boolean {
		return this.isPolling;
	}

	/**
	 * Get last event ID
	 */
	getLastEventId(): number {
		return this.lastEventId;
	}

	/**
	 * Reset last event ID (useful for testing)
	 */
	reset(): void {
		this.lastEventId = 0;
	}
}
