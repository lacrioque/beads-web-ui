/**
 * API routes for beads issue management
 * Exposes beads daemon functionality via REST endpoints
 */

import Router from '@koa/router';
import { getRPCClient, isRPCClientConnected } from '../rpc/connection-manager.js';
import type { Context } from 'koa';

const router = new Router({ prefix: '/api' });

/**
 * Check RPC connection status
 */
router.get('/status', async (ctx: Context) => {
	const connected = isRPCClientConnected();
	ctx.body = {
		connected,
		status: connected ? 'ok' : 'disconnected',
		timestamp: new Date().toISOString()
	};
});

/**
 * List all issues
 * Query params: status, priority, type
 */
router.get('/issues', async (ctx: Context) => {
	const client = getRPCClient();

	const filters: Record<string, string> = {};
	if (ctx.query.status) filters.status = ctx.query.status as string;
	if (ctx.query.priority) filters.priority = ctx.query.priority as string;
	if (ctx.query.type) filters.type = ctx.query.type as string;

	const issues = await client.listIssues(filters);
	ctx.body = {
		issues,
		count: issues.length
	};
});

/**
 * Get a specific issue by ID
 */
router.get('/issues/:id', async (ctx: Context) => {
	const client = getRPCClient();
	const issue = await client.getIssue(ctx.params.id);

	if (!issue) {
		ctx.status = 404;
		ctx.body = {
			error: {
				message: `Issue ${ctx.params.id} not found`,
				status: 404
			}
		};
		return;
	}

	ctx.body = { issue };
});

/**
 * Get ready work (issues with no blockers)
 */
router.get('/ready', async (ctx: Context) => {
	const client = getRPCClient();
	const issues = await client.getReady();
	ctx.body = {
		issues,
		count: issues.length
	};
});

/**
 * Get issue statistics
 */
router.get('/stats', async (ctx: Context) => {
	const client = getRPCClient();
	const stats = await client.getStats();
	ctx.body = { stats };
});

/**
 * Get mutation events
 * Query param: since (event ID)
 */
router.get('/mutations', async (ctx: Context) => {
	const client = getRPCClient();
	const sinceId = ctx.query.since ? parseInt(ctx.query.since as string, 10) : 0;

	const mutations = await client.getMutations(sinceId);
	ctx.body = {
		mutations,
		count: mutations.length
	};
});

export default router;
