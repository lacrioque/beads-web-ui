/**
 * Integration tests for WebSocket real-time broadcasting
 * Tests WebSocket server, client connections, and mutation broadcasting
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from './index.js';
import type { ServerConfig } from './config.js';
import type { Server } from 'http';
import { promisify } from 'util';
import WebSocket from 'ws';
import { BeadsWebSocketServer } from './websocket/server.js';
import type { WebSocketMessage } from './websocket/server.js';

describe('WebSocket Integration Tests', () => {
	let server: Server | null = null;
	let testPort: number;
	let baseUrl: string;
	let wsUrl: string;
	let wsServer: BeadsWebSocketServer;

	beforeAll(async () => {
		testPort = 4000 + Math.floor(Math.random() * 1000);
		baseUrl = `http://localhost:${testPort}`;
		wsUrl = `ws://localhost:${testPort}/ws`;

		const config: ServerConfig = {
			port: testPort,
			host: 'localhost',
			beadsDaemonSocket: process.env.BEADS_DAEMON_SOCKET || `${process.env.HOME}/.beads/bd.sock`,
			nodeEnv: 'test',
			staticPath: 'build/client',
			buildPath: 'build'
		};

		// Start the server
		const app = await createApp(config);
		server = app.listen(testPort, 'localhost');

		await new Promise<void>((resolve) => {
			server!.on('listening', () => resolve());
		});

		// Initialize WebSocket server
		wsServer = new BeadsWebSocketServer();
		wsServer.initialize(server);
	});

	afterAll(async () => {
		// Clean up
		if (wsServer) {
			wsServer.close();
		}
		if (server) {
			const close = promisify(server.close.bind(server));
			await close();
			server = null;
		}
	});

	describe('WebSocket Connection', () => {
		it('should accept WebSocket connections on /ws path', async () => {
			expect.assertions(2);

			const ws = new WebSocket(wsUrl);

			// Set up message listener before connection completes
			const messagePromise = new Promise<WebSocketMessage>((resolve, reject) => {
				ws.on('message', (data: Buffer) => {
					try {
						const msg = JSON.parse(data.toString());
						resolve(msg);
					} catch (error) {
						reject(error);
					}
				});

				setTimeout(() => {
					reject(new Error('No message received'));
				}, 5000);
			});

			await new Promise<void>((resolve, reject) => {
				ws.on('open', () => {
					expect(ws.readyState).toBe(WebSocket.OPEN);
					resolve();
				});

				ws.on('error', (error) => {
					reject(error);
				});

				// Timeout after 5 seconds
				setTimeout(() => {
					reject(new Error('WebSocket connection timeout'));
				}, 5000);
			});

			// Should receive welcome message
			const message = await messagePromise;
			expect(message.type).toBe('ping');

			ws.close();
		});

		it('should track connected clients', async () => {
			expect.assertions(3);

			const ws1 = new WebSocket(wsUrl);
			await new Promise<void>((resolve) => {
				ws1.on('open', () => resolve());
			});

			// Wait for server to process connection
			await new Promise((resolve) => setTimeout(resolve, 50));
			const countAfterFirst = wsServer.getClientCount();

			const ws2 = new WebSocket(wsUrl);
			await new Promise<void>((resolve) => {
				ws2.on('open', () => resolve());
			});

			// Wait for server to process connection
			await new Promise((resolve) => setTimeout(resolve, 50));
			const countAfterSecond = wsServer.getClientCount();

			expect(countAfterSecond).toBeGreaterThan(countAfterFirst);
			expect(countAfterSecond - countAfterFirst).toBe(1);

			ws1.close();
			ws2.close();

			// Wait for disconnection
			await new Promise((resolve) => setTimeout(resolve, 150));

			const finalCount = wsServer.getClientCount();
			expect(finalCount).toBe(countAfterSecond - 2);
		});

		it('should handle client disconnection gracefully', async () => {
			expect.assertions(2);

			const initialCount = wsServer.getClientCount();

			const ws = new WebSocket(wsUrl);
			await new Promise<void>((resolve) => {
				ws.on('open', () => resolve());
			});

			expect(wsServer.getClientCount()).toBe(initialCount + 1);

			ws.close();

			// Wait for disconnection to be processed
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(wsServer.getClientCount()).toBe(initialCount);
		});
	});

	describe('Message Broadcasting', () => {
		it('should broadcast messages to all connected clients', async () => {
			expect.assertions(4);

			// Connect two clients
			const ws1 = new WebSocket(wsUrl);
			const ws2 = new WebSocket(wsUrl);

			// Set up welcome message handlers before connection
			const welcome1 = new Promise<void>((resolve) => {
				ws1.once('message', () => resolve());
			});
			const welcome2 = new Promise<void>((resolve) => {
				ws2.once('message', () => resolve());
			});

			await Promise.all([
				new Promise<void>((resolve) => ws1.on('open', () => resolve())),
				new Promise<void>((resolve) => ws2.on('open', () => resolve()))
			]);

			// Wait for welcome messages
			await Promise.all([welcome1, welcome2]);

			// Set up message listeners for the broadcast
			const message1Promise = new Promise<WebSocketMessage>((resolve) => {
				ws1.once('message', (data: Buffer) => {
					resolve(JSON.parse(data.toString()));
				});
			});

			const message2Promise = new Promise<WebSocketMessage>((resolve) => {
				ws2.once('message', (data: Buffer) => {
					resolve(JSON.parse(data.toString()));
				});
			});

			// Broadcast a test message
			wsServer.broadcast({
				type: 'mutation',
				data: { test: 'broadcast' },
				timestamp: new Date().toISOString()
			});

			// Both clients should receive the message
			const [msg1, msg2] = await Promise.all([message1Promise, message2Promise]);

			expect(msg1.type).toBe('mutation');
			expect(msg1.data).toEqual({ test: 'broadcast' });
			expect(msg2.type).toBe('mutation');
			expect(msg2.data).toEqual({ test: 'broadcast' });

			ws1.close();
			ws2.close();
		});

		it('should not broadcast to disconnected clients', async () => {
			expect.assertions(1);

			const ws1 = new WebSocket(wsUrl);
			const ws2 = new WebSocket(wsUrl);

			// Set up welcome message handlers
			const welcome1 = new Promise<void>((resolve) => {
				ws1.once('message', () => resolve());
			});
			const welcome2 = new Promise<void>((resolve) => {
				ws2.once('message', () => resolve());
			});

			await Promise.all([
				new Promise<void>((resolve) => ws1.on('open', () => resolve())),
				new Promise<void>((resolve) => ws2.on('open', () => resolve()))
			]);

			// Wait for welcome messages
			await Promise.all([welcome1, welcome2]);

			// Disconnect ws1
			ws1.close();
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Set up message listener only for ws2
			const message2Promise = new Promise<WebSocketMessage>((resolve) => {
				ws2.once('message', (data: Buffer) => {
					resolve(JSON.parse(data.toString()));
				});
			});

			// Broadcast a test message
			wsServer.broadcast({
				type: 'mutation',
				data: { test: 'selective' },
				timestamp: new Date().toISOString()
			});

			// Only ws2 should receive the message
			const msg2 = await message2Promise;
			expect(msg2.type).toBe('mutation');

			ws2.close();
		});
	});

	describe('Message Types', () => {
		it('should send ping messages with timestamp', async () => {
			expect.assertions(2);

			const ws = new WebSocket(wsUrl);

			// Set up message listener before connection
			const messagePromise = new Promise<WebSocketMessage>((resolve) => {
				ws.on('message', (data: Buffer) => {
					resolve(JSON.parse(data.toString()));
				});
			});

			await new Promise<void>((resolve) => {
				ws.on('open', () => resolve());
			});

			const message = await messagePromise;

			expect(message.type).toBe('ping');
			expect(message.timestamp).toBeDefined();

			ws.close();
		});

		it('should broadcast mutation events with correct structure', async () => {
			expect.assertions(3);

			const ws = new WebSocket(wsUrl);

			// Set up welcome message handler
			const welcomePromise = new Promise<void>((resolve) => {
				ws.once('message', () => resolve());
			});

			await new Promise<void>((resolve) => {
				ws.on('open', () => resolve());
			});

			// Wait for welcome message
			await welcomePromise;

			// Set up listener for broadcast
			const messagePromise = new Promise<WebSocketMessage>((resolve) => {
				ws.once('message', (data: Buffer) => {
					resolve(JSON.parse(data.toString()));
				});
			});

			// Broadcast mutation
			wsServer.broadcast({
				type: 'mutation',
				data: {
					id: 'test-1',
					operation: 'create',
					timestamp: '2025-11-08T10:00:00Z'
				},
				timestamp: new Date().toISOString()
			});

			const message = await messagePromise;

			expect(message.type).toBe('mutation');
			expect(message.data).toHaveProperty('id', 'test-1');
			expect(message.timestamp).toBeDefined();

			ws.close();
		});
	});

	describe('Error Handling', () => {
		it('should handle malformed messages gracefully', async () => {
			expect.assertions(1);

			const ws = new WebSocket(wsUrl);
			await new Promise<void>((resolve) => {
				ws.on('open', () => resolve());
			});

			// Send malformed message
			ws.send('not valid json');

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Connection should still be open
			expect(ws.readyState).toBe(WebSocket.OPEN);

			ws.close();
		});

		it('should close connection on WebSocket error', async () => {
			expect.assertions(2);

			const ws = new WebSocket(wsUrl);
			await new Promise<void>((resolve) => {
				ws.on('open', () => resolve());
			});

			// Wait for server to process connection
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Client should be added
			const countAfterConnect = wsServer.getClientCount();
			expect(countAfterConnect).toBeGreaterThan(0);

			// Simulate error by terminating the socket
			ws.terminate();

			// Wait for cleanup
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Client should be removed
			const finalCount = wsServer.getClientCount();
			expect(finalCount).toBe(countAfterConnect - 1);
		});
	});
});
