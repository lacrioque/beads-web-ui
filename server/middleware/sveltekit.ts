/**
 * SvelteKit handler middleware for Koa
 * Wraps the SvelteKit Node.js handler to work with Koa
 */

import type Koa from 'koa';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Create a Koa middleware from the SvelteKit handler
 */
export async function createSvelteKitMiddleware(buildPath: string): Promise<Koa.Middleware> {
	const handlerPath = path.join(buildPath, 'handler.js');

	// Check if the build exists (production mode)
	if (!fs.existsSync(handlerPath)) {
		console.warn(`SvelteKit build not found at ${handlerPath}`);
		console.warn('Run "bun run build" to create the production build');
		return async (ctx, next) => {
			await next();
			if (ctx.body === undefined && ctx.status === 404) {
				ctx.status = 503;
				ctx.body = {
					error: 'Service Unavailable',
					message: 'SvelteKit application not built. Run "bun run build" first.'
				};
			}
		};
	}

	// Dynamically import the handler
	let handler: (req: IncomingMessage, res: ServerResponse) => void;

	try {
		// Convert to file:// URL for dynamic import
		const handlerUrl = `file://${path.resolve(handlerPath)}`;
		const module = await import(handlerUrl);
		handler = module.handler;

		if (!handler) {
			throw new Error('Handler not exported from build');
		}
	} catch (error) {
		console.error('Failed to load SvelteKit handler:', error);
		return async (ctx, next) => {
			await next();
			if (ctx.body === undefined && ctx.status === 404) {
				ctx.status = 500;
				ctx.body = {
					error: 'Internal Server Error',
					message: 'Failed to load SvelteKit handler'
				};
			}
		};
	}

	return async (ctx, next) => {
		// Let other middleware handle first (API routes, etc.)
		// Only use SvelteKit handler if no other middleware handled the request
		await next();

		// If the response has already been sent or handled, don't use SvelteKit handler
		if (ctx.body !== undefined || ctx.status !== 404) {
			return;
		}

		// Use SvelteKit handler
		return new Promise<void>((resolve, reject) => {
			// Reset status for SvelteKit
			ctx.status = 200;
			ctx.respond = false; // Tell Koa not to handle the response

			// Call the SvelteKit handler with raw Node.js req/res
			try {
				handler(ctx.req, ctx.res);

				// Wait for response to finish
				ctx.res.on('finish', () => {
					resolve();
				});

				ctx.res.on('error', (err) => {
					reject(err);
				});
			} catch (error) {
				reject(error);
			}
		});
	};
}
