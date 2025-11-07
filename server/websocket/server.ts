/**
 * WebSocket server for real-time updates
 * Handles client connections and broadcasts mutation events
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
	type: 'mutation' | 'stats' | 'issues' | 'ping' | 'pong' | 'error';
	data?: unknown;
	timestamp: string;
}

export interface WebSocketClient {
	ws: WebSocket;
	id: string;
	lastPing: number;
}

/**
 * WebSocket server manager
 */
export class BeadsWebSocketServer extends EventEmitter {
	private wss: WebSocketServer | null = null;
	private clients: Map<string, WebSocketClient> = new Map();
	private pingInterval: NodeJS.Timeout | null = null;
	private nextClientId = 1;

	/**
	 * Initialize WebSocket server
	 */
	initialize(server: Server): void {
		this.wss = new WebSocketServer({
			server,
			path: '/ws'
		});

		this.wss.on('connection', (ws: WebSocket) => {
			this.handleConnection(ws);
		});

		// Start ping interval to keep connections alive
		this.startPingInterval();

		console.log('✓ WebSocket server initialized at /ws');
	}

	/**
	 * Handle new client connection
	 */
	private handleConnection(ws: WebSocket): void {
		const clientId = `client-${this.nextClientId++}`;
		const client: WebSocketClient = {
			ws,
			id: clientId,
			lastPing: Date.now()
		};

		this.clients.set(clientId, client);
		console.log(`WebSocket client connected: ${clientId} (${this.clients.size} total)`);

		// Send welcome message
		this.sendToClient(client, {
			type: 'ping',
			data: { message: 'Connected to beads monitor' },
			timestamp: new Date().toISOString()
		});

		// Handle incoming messages
		ws.on('message', (data: Buffer) => {
			try {
				const message = JSON.parse(data.toString());
				this.handleMessage(client, message);
			} catch (error) {
				console.error('Failed to parse WebSocket message:', error);
			}
		});

		// Handle client disconnect
		ws.on('close', () => {
			this.clients.delete(clientId);
			console.log(`WebSocket client disconnected: ${clientId} (${this.clients.size} remaining)`);
		});

		// Handle errors
		ws.on('error', (error) => {
			console.error(`WebSocket error for ${clientId}:`, error);
			this.clients.delete(clientId);
		});

		this.emit('connection', client);
	}

	/**
	 * Handle incoming message from client
	 */
	private handleMessage(client: WebSocketClient, message: unknown): void {
		const msg = message as WebSocketMessage;

		switch (msg.type) {
			case 'pong':
				client.lastPing = Date.now();
				break;
			default:
				console.log(`Unknown message type from ${client.id}:`, msg.type);
		}
	}

	/**
	 * Send message to specific client
	 */
	private sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
		if (client.ws.readyState === WebSocket.OPEN) {
			try {
				client.ws.send(JSON.stringify(message));
			} catch (error) {
				console.error(`Failed to send message to ${client.id}:`, error);
			}
		}
	}

	/**
	 * Broadcast message to all connected clients
	 */
	broadcast(message: WebSocketMessage): void {
		const data = JSON.stringify(message);
		let sent = 0;

		for (const client of this.clients.values()) {
			if (client.ws.readyState === WebSocket.OPEN) {
				try {
					client.ws.send(data);
					sent++;
				} catch (error) {
					console.error(`Failed to broadcast to ${client.id}:`, error);
				}
			}
		}

		if (sent > 0) {
			console.log(`Broadcasted ${message.type} to ${sent} client(s)`);
		}
	}

	/**
	 * Start ping interval to keep connections alive
	 */
	private startPingInterval(): void {
		this.pingInterval = setInterval(() => {
			const now = Date.now();
			const timeout = 60000; // 60 seconds

			for (const [clientId, client] of this.clients.entries()) {
				// Check if client is still responsive
				if (now - client.lastPing > timeout) {
					console.log(`Client ${clientId} timed out, disconnecting`);
					client.ws.terminate();
					this.clients.delete(clientId);
					continue;
				}

				// Send ping
				if (client.ws.readyState === WebSocket.OPEN) {
					this.sendToClient(client, {
						type: 'ping',
						timestamp: new Date().toISOString()
					});
				}
			}
		}, 30000); // Every 30 seconds
	}

	/**
	 * Get number of connected clients
	 */
	getClientCount(): number {
		return this.clients.size;
	}

	/**
	 * Close all connections and clean up
	 */
	close(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		for (const client of this.clients.values()) {
			client.ws.close();
		}

		this.clients.clear();

		if (this.wss) {
			this.wss.close();
			this.wss = null;
		}

		console.log('WebSocket server closed');
	}
}
