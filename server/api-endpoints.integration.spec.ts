/**
 * Integration tests for API endpoints with real RPC client
 * Tests API routes with actual daemon connection when available
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './index.js';
import type { ServerConfig } from './config.js';
import type { Server } from 'http';
import { promisify } from 'util';
import { initializeRPCClient, closeRPCClient, isRPCClientConnected } from './rpc/connection-manager.js';

describe('API Endpoints Integration Tests', () => {
	let server: Server | null = null;
	let testPort: number;
	let daemonAvailable = false;
	let baseUrl: string;

	beforeAll(async () => {
		testPort = 4000 + Math.floor(Math.random() * 1000);
		baseUrl = `http://localhost:${testPort}`;

		const config: ServerConfig = {
			port: testPort,
			host: 'localhost',
			beadsDaemonSocket: process.env.BEADS_DAEMON_SOCKET || `${process.env.HOME}/.beads/bd.sock`,
			nodeEnv: 'test',
			staticPath: 'build/client',
			buildPath: 'build'
		};

		// Try to connect to daemon
		try {
			await initializeRPCClient(config);
			daemonAvailable = isRPCClientConnected();
			console.log(`Daemon connection: ${daemonAvailable ? 'available' : 'not available'}`);
		} catch (error) {
			console.log('Daemon not available, some tests will be skipped');
			daemonAvailable = false;
		}

		// Start the server
		const app = await createApp(config);
		server = app.listen(testPort, 'localhost');

		await new Promise<void>((resolve) => {
			server!.on('listening', () => resolve());
		});
	});

	afterAll(async () => {
		// Clean up
		if (server) {
			const close = promisify(server.close.bind(server));
			await close();
			server = null;
		}
		closeRPCClient();
	});

	describe('GET /api/status', () => {
		it('should return connection status', async () => {
			expect.assertions(3);

			const response = await fetch(`${baseUrl}/api/status`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('connected');
			expect(data).toHaveProperty('timestamp');
		});

		it('should indicate daemon connection status correctly', async () => {
			expect.assertions(1);

			const response = await fetch(`${baseUrl}/api/status`);
			const data = await response.json();

			expect(data.connected).toBe(daemonAvailable);
		});
	});

	describe('GET /api/issues', () => {
		it('should return issues list endpoint', async () => {
			expect.assertions(2);

			const response = await fetch(`${baseUrl}/api/issues`);

			expect(response.status).toBe(daemonAvailable ? 200 : 500);

			if (daemonAvailable) {
				const data = await response.json();
				expect(data).toHaveProperty('issues');
			} else {
				expect(true).toBe(true); // Placeholder for second assertion
			}
		});

		it.skipIf(!daemonAvailable)('should return array of issues when daemon is available', async () => {
			expect.assertions(2);

			const response = await fetch(`${baseUrl}/api/issues`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(data.issues)).toBe(true);
		});

		it.skipIf(!daemonAvailable)('should support status filter parameter', async () => {
			expect.assertions(2);

			const response = await fetch(`${baseUrl}/api/issues?status=open`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('issues');
		});

		it.skipIf(!daemonAvailable)('should support priority filter parameter', async () => {
			expect.assertions(2);

			const response = await fetch(`${baseUrl}/api/issues?priority=P1`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('issues');
		});

		it.skipIf(!daemonAvailable)('should support multiple filter parameters', async () => {
			expect.assertions(2);

			const response = await fetch(`${baseUrl}/api/issues?status=open&priority=P1`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('count');
		});
	});

	describe('GET /api/stats', () => {
		it.skipIf(!daemonAvailable)('should return issue statistics', async () => {
			expect.assertions(6);

			const response = await fetch(`${baseUrl}/api/stats`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('stats');
			expect(data.stats).toHaveProperty('total');
			expect(data.stats).toHaveProperty('open');
			expect(data.stats).toHaveProperty('in_progress');
			expect(data.stats).toHaveProperty('closed');
		});

		it.skipIf(!daemonAvailable)('should include priority and type breakdowns', async () => {
			expect.assertions(3);

			const response = await fetch(`${baseUrl}/api/stats`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.stats).toHaveProperty('by_priority');
			expect(data.stats).toHaveProperty('by_type');
		});
	});

	describe('GET /api/ready', () => {
		it.skipIf(!daemonAvailable)('should return ready issues', async () => {
			expect.assertions(3);

			const response = await fetch(`${baseUrl}/api/ready`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('issues');
			expect(Array.isArray(data.issues)).toBe(true);
		});
	});

	describe('GET /api/mutations', () => {
		it.skipIf(!daemonAvailable)('should return mutations with default since parameter', async () => {
			expect.assertions(3);

			const response = await fetch(`${baseUrl}/api/mutations`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('mutations');
			expect(Array.isArray(data.mutations)).toBe(true);
		});

		it.skipIf(!daemonAvailable)('should support since parameter', async () => {
			expect.assertions(3);

			const response = await fetch(`${baseUrl}/api/mutations?since=100`);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('mutations');
			expect(data).toHaveProperty('count');
		});
	});

	describe('Error Handling', () => {
		it('should handle requests when daemon is not available', async () => {
			expect.assertions(1);

			// This test runs regardless of daemon status
			const response = await fetch(`${baseUrl}/api/status`);

			// Status endpoint should always work
			expect(response.status).toBe(200);
		});

		it.skipIf(!daemonAvailable)('should return 404 for nonexistent issue', async () => {
			expect.assertions(1);

			const response = await fetch(`${baseUrl}/api/issues/nonexistent-issue-id`);

			expect(response.status).toBe(404);
		});

		it.skipIf(!daemonAvailable)('should return 404 for nonexistent epic', async () => {
			expect.assertions(1);

			const response = await fetch(`${baseUrl}/api/epics/nonexistent-epic-id`);

			expect(response.status).toBe(404);
		});
	});

	describe('Response Headers', () => {
		it('should include CORS headers', async () => {
			expect.assertions(1);

			const response = await fetch(`${baseUrl}/api/status`);

			expect(response.headers.get('access-control-allow-origin')).toBe('*');
		});

		it('should return JSON content type for API endpoints', async () => {
			expect.assertions(1);

			const response = await fetch(`${baseUrl}/api/status`);

			expect(response.headers.get('content-type')).toContain('application/json');
		});
	});
});
