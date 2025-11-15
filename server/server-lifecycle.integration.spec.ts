/**
 * Integration tests for server lifecycle
 * Tests server startup, daemon connection, and graceful shutdown
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from './index.js';
import type { ServerConfig } from './config.js';
import type { Server } from 'http';
import { promisify } from 'util';

describe('Server Lifecycle Integration Tests', () => {
	let server: Server | null = null;
	let testPort: number;

	beforeEach(() => {
		// Use a random port for each test to avoid conflicts
		testPort = 3000 + Math.floor(Math.random() * 1000);
	});

	afterEach(async () => {
		// Clean up server after each test
		if (server) {
			const close = promisify(server.close.bind(server));
			await close();
			server = null;
		}
	});

	describe('Server Startup', () => {
		it('should create and start a Koa server', async () => {
			expect.assertions(2);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			expect(app).toBeDefined();

			// Start the server
			server = app.listen(testPort, 'localhost');

			// Wait for server to be listening
			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			const address = server.address();
			expect(address).toBeTruthy();
		});

		it('should respond to health check endpoint', async () => {
			expect.assertions(3);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			// Make a request to the health endpoint
			const response = await fetch(`http://localhost:${testPort}/health`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.status).toBe('ok');
			expect(data.version).toBeDefined();
		});

		it('should handle missing daemon connection gracefully', async () => {
			expect.assertions(1);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/nonexistent-daemon.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			// Server should start even if daemon is not available
			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			expect(server.listening).toBe(true);
		});
	});

	describe('Graceful Shutdown', () => {
		it('should close server when close() is called', async () => {
			expect.assertions(2);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			expect(server.listening).toBe(true);

			// Close the server
			const close = promisify(server.close.bind(server));
			await close();

			expect(server.listening).toBe(false);
			server = null; // Prevent double cleanup
		});

		it('should reject new connections after close', async () => {
			expect.assertions(2);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			// Verify server is responding
			const response1 = await fetch(`http://localhost:${testPort}/health`);
			expect(response1.status).toBe(200);

			// Close the server
			const close = promisify(server.close.bind(server));
			await close();
			server = null;

			// Attempt to connect should fail
			try {
				await fetch(`http://localhost:${testPort}/health`, {
					signal: AbortSignal.timeout(1000)
				});
				// If we get here, the test should fail
				expect(true).toBe(false);
			} catch (error) {
				// Expected - connection should fail
				expect(error).toBeDefined();
			}
		});
	});

	describe('Middleware Stack', () => {
		it('should apply CORS headers', async () => {
			expect.assertions(1);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			const response = await fetch(`http://localhost:${testPort}/health`);
			const corsHeader = response.headers.get('access-control-allow-origin');

			expect(corsHeader).toBe('*');
		});

		it('should handle 404 responses for nonexistent routes', async () => {
			expect.assertions(1);

			const config: ServerConfig = {
				port: testPort,
				host: 'localhost',
				beadsDaemonSocket: '/tmp/test-bd.sock',
				nodeEnv: 'test',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const app = await createApp(config);
			server = app.listen(testPort, 'localhost');

			await new Promise<void>((resolve) => {
				server!.on('listening', () => resolve());
			});

			// Request a nonexistent endpoint
			const response = await fetch(`http://localhost:${testPort}/api/nonexistent`);

			// Should return 404 (SvelteKit handles with HTML, which is correct)
			expect(response.status).toBe(404);
		});
	});
});
