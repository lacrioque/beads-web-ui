/**
 * Unit tests for API routes
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import request from 'supertest';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import apiRouter from './api.js';
import * as connectionManager from '../rpc/connection-manager.js';

// Mock the connection manager
vi.mock('../rpc/connection-manager.js', () => ({
	getRPCClient: vi.fn(),
	isRPCClientConnected: vi.fn()
}));

describe('API Routes', () => {
	let app: Koa;
	let mockClient: any;

	beforeEach(() => {
		// Create fresh Koa app for each test
		app = new Koa();
		app.use(bodyParser());
		app.use(apiRouter.routes());
		app.use(apiRouter.allowedMethods());

		// Create mock RPC client
		mockClient = {
			listIssues: vi.fn(),
			getIssue: vi.fn(),
			getStats: vi.fn(),
			getReady: vi.fn(),
			getMutations: vi.fn()
		};

		// Setup default mock implementations
		(connectionManager.getRPCClient as Mock).mockReturnValue(mockClient);
		(connectionManager.isRPCClientConnected as Mock).mockReturnValue(true);
	});

	describe('GET /api/status', () => {
		it('should return connection status when connected', async () => {
			(connectionManager.isRPCClientConnected as Mock).mockReturnValue(true);

			const response = await request(app.callback()).get('/api/status');

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('connected', true);
			expect(response.body).toHaveProperty('status', 'ok');
			expect(response.body).toHaveProperty('timestamp');
		});

		it('should return disconnected status when not connected', async () => {
			(connectionManager.isRPCClientConnected as Mock).mockReturnValue(false);

			const response = await request(app.callback()).get('/api/status');

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('connected', false);
			expect(response.body).toHaveProperty('status', 'disconnected');
		});
	});

	describe('GET /api/issues', () => {
		it('should return list of issues', async () => {
			const mockIssues = [
				{ id: 'test-1', title: 'Test Issue 1', status: 'open', priority: 1 },
				{ id: 'test-2', title: 'Test Issue 2', status: 'closed', priority: 2 }
			];
			mockClient.listIssues.mockResolvedValue(mockIssues);

			const response = await request(app.callback()).get('/api/issues');

			expect(response.status).toBe(200);
			expect(response.body.issues).toEqual(mockIssues);
			expect(response.body.count).toBe(2);
		});

		it('should filter issues by status', async () => {
			const mockIssues = [{ id: 'test-1', title: 'Test Issue', status: 'open' }];
			mockClient.listIssues.mockResolvedValue(mockIssues);

			await request(app.callback()).get('/api/issues?status=open');

			expect(mockClient.listIssues).toHaveBeenCalledWith({ status: 'open' });
		});

		it('should return issues filtered by parent', async () => {
			const mockParent = {
				id: 'epic-1',
				title: 'Test Epic',
				status: 'open',
				priority: 1,
				issue_type: 'epic',
				dependents: [
					{ id: 'child-1', title: 'Child 1', status: 'open', priority: 2 },
					{ id: 'child-2', title: 'Child 2', status: 'closed', priority: 2 }
				]
			};
			mockClient.getIssue.mockResolvedValue(mockParent);

			const response = await request(app.callback()).get('/api/issues?parent=epic-1');

			expect(response.status).toBe(200);
			expect(response.body.issues).toHaveLength(2);
			expect(response.body.parent).toBe('epic-1');
			expect(mockClient.getIssue).toHaveBeenCalledWith('epic-1');
		});

		it('should return 404 when parent not found', async () => {
			mockClient.getIssue.mockResolvedValue(null);

			const response = await request(app.callback()).get('/api/issues?parent=nonexistent');

			expect(response.status).toBe(404);
			expect(response.body.error.message).toContain('not found');
		});
	});

	describe('GET /api/issues/:id', () => {
		it('should return a specific issue', async () => {
			const mockIssue = { id: 'test-1', title: 'Test Issue', status: 'open' };
			mockClient.getIssue.mockResolvedValue(mockIssue);

			const response = await request(app.callback()).get('/api/issues/test-1');

			expect(response.status).toBe(200);
			expect(response.body.issue).toEqual(mockIssue);
			expect(mockClient.getIssue).toHaveBeenCalledWith('test-1');
		});

		it('should return 404 for non-existent issue', async () => {
			mockClient.getIssue.mockResolvedValue(null);

			const response = await request(app.callback()).get('/api/issues/nonexistent');

			expect(response.status).toBe(404);
			expect(response.body.error.message).toContain('not found');
		});
	});

	describe('GET /api/stats', () => {
		it('should return issue statistics with breakdowns', async () => {
			const mockBaseStats = {
				total_issues: 10,
				open_issues: 5,
				in_progress_issues: 2,
				closed_issues: 3
			};
			const mockIssues = [
				{ priority: 1, type: 'bug' },
				{ priority: 1, type: 'task' },
				{ priority: 2, type: 'bug' }
			];

			mockClient.getStats.mockResolvedValue(mockBaseStats);
			mockClient.listIssues.mockResolvedValue(mockIssues);

			const response = await request(app.callback()).get('/api/stats');

			expect(response.status).toBe(200);
			expect(response.body.stats).toMatchObject({
				total: 10,
				open: 5,
				in_progress: 2,
				closed: 3,
				by_priority: { '1': 2, '2': 1 },
				by_type: { bug: 2, task: 1 }
			});
		});
	});

	describe('GET /api/epics/:id', () => {
		it('should return epic with children and stats', async () => {
			const mockEpic = {
				id: 'epic-1',
				title: 'Test Epic',
				issue_type: 'epic',
				status: 'open',
				priority: 1,
				dependents: [
					{ id: 'child-1', status: 'open' },
					{ id: 'child-2', status: 'in_progress' },
					{ id: 'child-3', status: 'closed' }
				]
			};
			mockClient.getIssue.mockResolvedValue(mockEpic);

			const response = await request(app.callback()).get('/api/epics/epic-1');

			expect(response.status).toBe(200);
			expect(response.body.epic.id).toBe('epic-1');
			expect(response.body.children).toHaveLength(3);
			expect(response.body.stats).toMatchObject({
				total: 3,
				open: 1,
				in_progress: 1,
				closed: 1
			});
		});

		it('should return 404 for non-existent epic', async () => {
			mockClient.getIssue.mockResolvedValue(null);

			const response = await request(app.callback()).get('/api/epics/nonexistent');

			expect(response.status).toBe(404);
		});

		it('should return 400 for non-epic issue type', async () => {
			const mockTask = {
				id: 'task-1',
				title: 'Test Task',
				issue_type: 'task',
				status: 'open'
			};
			mockClient.getIssue.mockResolvedValue(mockTask);

			const response = await request(app.callback()).get('/api/epics/task-1');

			expect(response.status).toBe(400);
			expect(response.body.error.message).toContain('not an epic');
		});
	});

	describe('GET /api/ready', () => {
		it('should return ready issues', async () => {
			const mockReadyIssues = [
				{ id: 'ready-1', title: 'Ready Issue 1' },
				{ id: 'ready-2', title: 'Ready Issue 2' }
			];
			mockClient.getReady.mockResolvedValue(mockReadyIssues);

			const response = await request(app.callback()).get('/api/ready');

			expect(response.status).toBe(200);
			expect(response.body.issues).toEqual(mockReadyIssues);
			expect(response.body.count).toBe(2);
		});
	});

	describe('GET /api/mutations', () => {
		it('should return mutations since given ID', async () => {
			const mockMutations = [
				{ id: 5, timestamp: '2025-11-08T10:00:00Z', operation: 'create', issue_id: 'test-1' },
				{ id: 6, timestamp: '2025-11-08T10:05:00Z', operation: 'update', issue_id: 'test-2' }
			];
			mockClient.getMutations.mockResolvedValue(mockMutations);

			const response = await request(app.callback()).get('/api/mutations?since=4');

			expect(response.status).toBe(200);
			expect(response.body.mutations).toEqual(mockMutations);
			expect(response.body.count).toBe(2);
			expect(mockClient.getMutations).toHaveBeenCalledWith(4);
		});

		it('should default to since=0 when not provided', async () => {
			mockClient.getMutations.mockResolvedValue([]);

			await request(app.callback()).get('/api/mutations');

			expect(mockClient.getMutations).toHaveBeenCalledWith(0);
		});
	});
});
