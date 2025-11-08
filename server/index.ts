/**
 * Custom Koa server for beads-web-monitor
 * Integrates with SvelteKit and provides additional server functionality
 */

import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import { loadConfig, validateConfig } from './config.js';
import type { ServerConfig } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './middleware/logger.js';
import { cors } from './middleware/cors.js';
import { initializeRPCClient, closeRPCClient } from './rpc/connection-manager.js';
import apiRouter from './routes/api.js';
import { BeadsWebSocketServer } from './websocket/server.js';
import { MutationPoller } from './websocket/mutation-poller.js';

/**
 * Create and configure the Koa application
 */
export function createApp(config: ServerConfig): Koa {
	const app = new Koa();
	const router = new Router();

	// Basic health check endpoint
	router.get('/health', (ctx) => {
		ctx.body = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: '0.0.1'
		};
	});

	// Apply middleware (order matters!)
	app.use(errorHandler); // Error handler should be first
	app.use(cors()); // CORS should be early to handle preflight requests
	app.use(logger()); // Logger should be early
	app.use(bodyParser());

	// Apply routes
	app.use(router.routes());
	app.use(router.allowedMethods());
	app.use(apiRouter.routes());
	app.use(apiRouter.allowedMethods());

	// Serve static files (SvelteKit client build) - should be last
	if (config.staticPath) {
		app.use(serve(config.staticPath));
	}

	return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
	const config = loadConfig();

	try {
		validateConfig(config);
	} catch (error) {
		console.error('Configuration validation failed:', error);
		process.exit(1);
	}

	// Initialize RPC client connection to beads daemon
	let rpcConnected = false;
	try {
		await initializeRPCClient(config);
		rpcConnected = true;
	} catch (error) {
		console.warn('Warning: Could not connect to beads daemon');
		console.warn('The server will start, but API endpoints may not work until daemon is available');
		console.warn('Start the daemon with: bd daemon');
	}

	const app = createApp(config);

	const server = app.listen(config.port, config.host, () => {
		console.log(`🚀 Server running at http://${config.host}:${config.port}`);
		console.log(`📊 Environment: ${config.nodeEnv}`);
		console.log(`🔌 Beads daemon socket: ${config.beadsDaemonSocket}`);
	});

	// Initialize WebSocket server
	const wsServer = new BeadsWebSocketServer();
	wsServer.initialize(server);

	// Initialize mutation poller
	const mutationPoller = new MutationPoller({ pollInterval: 2000 });

	// Connect mutation events to WebSocket broadcasts
	mutationPoller.on('mutations', (mutations) => {
		wsServer.broadcast({
			type: 'mutation',
			data: mutations,
			timestamp: new Date().toISOString()
		});
	});

	// Start polling if RPC client is connected
	if (rpcConnected) {
		mutationPoller.start();
	}

	// Graceful shutdown handling
	const shutdown = async (signal: string) => {
		console.log(`\n${signal} received, closing server gracefully...`);

		// Stop mutation polling
		mutationPoller.stop();

		// Close WebSocket server
		wsServer.close();

		// Close RPC client connection
		closeRPCClient();

		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});

		// Force shutdown after 10 seconds
		setTimeout(() => {
			console.error('Forced shutdown after timeout');
			process.exit(1);
		}, 10000);
	};

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
	startServer().catch((error) => {
		console.error('Failed to start server:', error);
		process.exit(1);
	});
}
