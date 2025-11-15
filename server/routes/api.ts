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
 * Query params: status, priority, type, parent
 */
router.get('/issues', async (ctx: Context) => {
	const client = getRPCClient();

	// If filtering by parent, get the parent's children
	if (ctx.query.parent) {
		const parentId = ctx.query.parent as string;
		const parent = await client.getIssue(parentId);

		if (!parent) {
			ctx.status = 404;
			ctx.body = {
				error: {
					message: `Parent issue ${parentId} not found`,
					status: 404
				}
			};
			return;
		}

		// Get children from dependents
		let children = (parent as any).dependents || [];

		// Apply additional filters to children
		if (ctx.query.status) {
			children = children.filter((issue: any) => issue.status === ctx.query.status);
		}
		if (ctx.query.priority) {
			children = children.filter(
				(issue: any) => issue.priority === parseInt(ctx.query.priority as string)
			);
		}
		if (ctx.query.type) {
			children = children.filter((issue: any) => issue.issue_type === ctx.query.type);
		}

		ctx.body = {
			issues: children,
			count: children.length,
			parent: parentId
		};
		return;
	}

	// Standard filtering
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
	const [baseStats, allIssues] = await Promise.all([
		client.getStats(),
		client.listIssues({})
	]);

	// Calculate by_priority breakdown
	const byPriority: Record<string, number> = {};
	// Calculate by_type breakdown
	const byType: Record<string, number> = {};

	allIssues.forEach((issue: any) => {
		// Count by priority
		if (issue.priority) {
			byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1;
		}

		// Count by type
		if (issue.type) {
			byType[issue.type] = (byType[issue.type] || 0) + 1;
		}
	});

	ctx.body = {
		stats: {
			total: baseStats.total_issues,
			open: baseStats.open_issues,
			in_progress: baseStats.in_progress_issues,
			closed: baseStats.closed_issues,
			by_priority: byPriority,
			by_type: byType
		}
	};
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

/**
 * Get epic details with stats and children
 */
router.get('/epics/:id', async (ctx: Context) => {
	const client = getRPCClient();
	const epic = await client.getIssue(ctx.params.id);

	if (!epic) {
		ctx.status = 404;
		ctx.body = {
			error: {
				message: `Epic ${ctx.params.id} not found`,
				status: 404
			}
		};
		return;
	}

	// Verify it's actually an epic
	const issueType = (epic as any).issue_type || epic.type;
	if (issueType !== 'epic') {
		ctx.status = 400;
		ctx.body = {
			error: {
				message: `Issue ${ctx.params.id} is not an epic (type: ${issueType})`,
				status: 400
			}
		};
		return;
	}

	// Calculate stats from children (dependents with parent-child relationship)
	const children = (epic as any).dependents || [];
	const stats = {
		total: children.length,
		open: children.filter((child: any) => child.status === 'open').length,
		in_progress: children.filter((child: any) => child.status === 'in_progress').length,
		closed: children.filter((child: any) => child.status === 'closed').length
	};

	ctx.body = {
		epic,
		children,
		stats
	};
});

export default router;
