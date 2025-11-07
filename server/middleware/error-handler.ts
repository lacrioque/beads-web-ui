/**
 * Error handling middleware for Koa
 * Catches and formats errors consistently
 */

import type { Context, Next } from 'koa';

export interface ErrorResponse {
	error: {
		message: string;
		status: number;
		code?: string;
		details?: unknown;
	};
	timestamp: string;
}

/**
 * Error handling middleware
 * Should be applied first in the middleware chain
 */
export async function errorHandler(ctx: Context, next: Next): Promise<void> {
	try {
		await next();
	} catch (err) {
		const error = err as Error & { status?: number; code?: string; expose?: boolean };

		// Determine status code
		ctx.status = error.status || 500;

		// Determine if we should expose the error message
		const shouldExpose = error.expose || ctx.status < 500;
		const message = shouldExpose ? error.message : 'Internal server error';

		// Build error response
		const response: ErrorResponse = {
			error: {
				message,
				status: ctx.status,
				code: error.code
			},
			timestamp: new Date().toISOString()
		};

		// Include details in development
		if (process.env.NODE_ENV === 'development') {
			response.error.details = {
				stack: error.stack,
				name: error.name
			};
		}

		ctx.body = response;
		ctx.type = 'application/json';

		// Log error
		console.error(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url} - ${ctx.status}`);
		console.error(error);

		// Emit error event for monitoring
		ctx.app.emit('error', error, ctx);
	}
}
