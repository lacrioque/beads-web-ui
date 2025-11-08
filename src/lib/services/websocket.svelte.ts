/**
 * WebSocket service for real-time updates
 * Uses Svelte 5 runes for reactivity
 */

import { serverManager } from './servers.svelte';

export interface WebSocketMessage {
	type: 'mutation' | 'stats' | 'issues' | 'ping' | 'pong' | 'error';
	data?: unknown;
	timestamp: string;
}

export interface MutationEvent {
	id: number;
	timestamp: string;
	operation: 'create' | 'update' | 'delete';
	issue_id: string;
}

class WebSocketService {
	private ws: WebSocket | null = $state(null);
	private reconnectTimer: number | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;

	connected = $state(false);
	lastMessage = $state<WebSocketMessage | null>(null);
	mutations = $state<MutationEvent[]>([]);

	/**
	 * Get WebSocket URL from configured server
	 */
	private getWebSocketUrl(): string {
		const serverUrl = serverManager.getActiveServerUrl();
		// Convert http:// or https:// to ws:// or wss://
		const wsUrl = serverUrl.replace(/^http/, 'ws');
		return `${wsUrl}/ws`;
	}

	/**
	 * Connect to WebSocket server
	 */
	connect(): void {
		if (this.ws && this.connected) {
			console.log('Already connected to WebSocket');
			return;
		}

		const wsUrl = this.getWebSocketUrl();
		console.log(`Connecting to WebSocket: ${wsUrl}`);

		try {
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('✓ Connected to WebSocket');
				this.connected = true;
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				this.handleMessage(event.data);
			};

			this.ws.onclose = () => {
				console.log('WebSocket disconnected');
				this.connected = false;
				this.ws = null;
				this.attemptReconnect();
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
			};
		} catch (error) {
			console.error('Failed to connect to WebSocket:', error);
			this.attemptReconnect();
		}
	}

	/**
	 * Handle incoming message
	 */
	private handleMessage(data: string): void {
		try {
			const message: WebSocketMessage = JSON.parse(data);
			this.lastMessage = message;

			switch (message.type) {
				case 'mutation':
					if (Array.isArray(message.data)) {
						this.mutations = message.data;
						console.log(`Received ${message.data.length} mutation(s)`);
					}
					break;
				case 'ping':
					// Respond to ping with pong
					this.send({
						type: 'pong',
						timestamp: new Date().toISOString()
					});
					break;
				default:
					console.log('Received message:', message.type);
			}
		} catch (error) {
			console.error('Failed to parse WebSocket message:', error);
		}
	}

	/**
	 * Send message to server
	 */
	send(message: WebSocketMessage): void {
		if (this.ws && this.connected) {
			try {
				this.ws.send(JSON.stringify(message));
			} catch (error) {
				console.error('Failed to send WebSocket message:', error);
			}
		}
	}

	/**
	 * Attempt to reconnect
	 */
	private attemptReconnect(): void {
		if (this.reconnectTimer) {
			return;
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

		console.log(
			`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		this.reconnectTimer = window.setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, delay);
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.connected = false;
	}

	/**
	 * Clear mutations
	 */
	clearMutations(): void {
		this.mutations = [];
	}

	/**
	 * Reconnect to WebSocket (used when server changes)
	 */
	reconnect(): void {
		console.log('Reconnecting to new server...');
		this.disconnect();
		this.reconnectAttempts = 0;
		this.connect();
	}
}

// Singleton instance
export const websocketService = new WebSocketService();

// Auto-connect on import
if (typeof window !== 'undefined') {
	websocketService.connect();
}
