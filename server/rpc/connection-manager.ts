/**
 * Connection Manager for beads daemon RPC client
 * Manages a singleton RPC client connection across the application
 */

import { BeadsRPCClient } from './client.js';
import type { ServerConfig } from '../config.js';

let client: BeadsRPCClient | null = null;

/**
 * Initialize the RPC client connection
 */
export async function initializeRPCClient(config: ServerConfig): Promise<BeadsRPCClient> {
	if (client) {
		return client;
	}

	client = new BeadsRPCClient(config.beadsDaemonSocket);

	// Set up event listeners
	client.on('connected', () => {
		console.log('✓ RPC client connected');
	});

	client.on('disconnected', () => {
		console.warn('⚠ RPC client disconnected');
	});

	client.on('error', (error) => {
		console.error('RPC client error:', error);
	});

	try {
		await client.connect();
		return client;
	} catch (error) {
		console.error('Failed to connect to beads daemon:', error);
		throw new Error(
			`Could not connect to beads daemon at ${config.beadsDaemonSocket}. ` +
			'Make sure the daemon is running with: bd daemon'
		);
	}
}

/**
 * Get the RPC client instance
 */
export function getRPCClient(): BeadsRPCClient {
	if (!client) {
		throw new Error('RPC client not initialized. Call initializeRPCClient first.');
	}
	return client;
}

/**
 * Close the RPC client connection
 */
export function closeRPCClient(): void {
	if (client) {
		client.disconnect();
		client = null;
	}
}

/**
 * Check if RPC client is connected
 */
export function isRPCClientConnected(): boolean {
	return client?.isConnected() ?? false;
}
