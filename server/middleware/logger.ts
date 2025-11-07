/**
 * Request logging middleware for Koa
 * Logs incoming requests and response times
 */

import type { Context, Next } from 'koa';

export interface LogEntry {
	timestamp: string;
	method: string;
	url: string;
	status: number;
	duration: number;
	ip?: string;
	userAgent?: string;
}

/**
 * Create a simple logger middleware
 */
export function logger() {
	return async (ctx: Context, next: Next): Promise<void> => {
		const start = Date.now();

		await next();

		const duration = Date.now() - start;

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			method: ctx.method,
			url: ctx.url,
			status: ctx.status,
			duration,
			ip: ctx.ip,
			userAgent: ctx.get('user-agent')
		};

		// Format log message
		const statusColor = getStatusColor(ctx.status);
		const methodColor = '\x1b[36m'; // Cyan
		const reset = '\x1b[0m';
		const dim = '\x1b[2m';

		console.log(
			`${dim}[${entry.timestamp}]${reset} ` +
				`${methodColor}${entry.method}${reset} ` +
				`${entry.url} ` +
				`${statusColor}${entry.status}${reset} ` +
				`${dim}${duration}ms${reset}`
		);
	};
}

/**
 * Get ANSI color code based on HTTP status
 */
function getStatusColor(status: number): string {
	if (status >= 500) return '\x1b[31m'; // Red
	if (status >= 400) return '\x1b[33m'; // Yellow
	if (status >= 300) return '\x1b[36m'; // Cyan
	if (status >= 200) return '\x1b[32m'; // Green
	return '\x1b[0m'; // Reset
}
