/**
 * CORS middleware for Koa
 * Reflects the request Origin header for flexible cross-origin access
 */

import type { Context, Next } from 'koa';

/**
 * CORS middleware that reflects the request origin
 * This allows any origin to make requests while maintaining proper CORS headers
 */
export function cors() {
	return async (ctx: Context, next: Next) => {
		// Get the origin from the request header
		const origin = ctx.get('Origin');

		// Set CORS headers
		if (origin) {
			// Reflect the request origin
			ctx.set('Access-Control-Allow-Origin', origin);
		} else {
			// If no origin header, allow any origin (for non-CORS requests)
			ctx.set('Access-Control-Allow-Origin', '*');
		}

		// Allow credentials
		ctx.set('Access-Control-Allow-Credentials', 'true');

		// Allowed methods
		ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

		// Allowed headers
		ctx.set(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, Authorization'
		);

		// Max age for preflight cache (24 hours)
		ctx.set('Access-Control-Max-Age', '86400');

		// Handle preflight requests
		if (ctx.method === 'OPTIONS') {
			ctx.status = 204;
			return;
		}

		await next();
	};
}
