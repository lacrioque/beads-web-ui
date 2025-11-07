/**
 * API service for fetching beads data
 */

export interface Issue {
	id: string;
	title: string;
	status: 'open' | 'in_progress' | 'closed';
	priority: 'P1' | 'P2' | 'P3';
	type?: string;
	assignee?: string;
	created: string;
	updated: string;
	closed?: string;
	description?: string;
	labels?: string[];
	dependencies?: string[];
}

export interface IssueStats {
	total: number;
	open: number;
	in_progress: number;
	closed: number;
	by_priority: Record<string, number>;
	by_type: Record<string, number>;
}

const API_BASE = '/api';

/**
 * Fetch all issues with optional filters
 */
export async function fetchIssues(filters?: {
	status?: string;
	priority?: string;
	type?: string;
}): Promise<Issue[]> {
	const params = new URLSearchParams();
	if (filters?.status) params.set('status', filters.status);
	if (filters?.priority) params.set('priority', filters.priority);
	if (filters?.type) params.set('type', filters.type);

	const query = params.toString();
	const url = `${API_BASE}/issues${query ? `?${query}` : ''}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch issues: ${response.statusText}`);
	}

	const data = await response.json();
	return data.issues || [];
}

/**
 * Fetch a single issue by ID
 */
export async function fetchIssue(id: string): Promise<Issue> {
	const response = await fetch(`${API_BASE}/issues/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			throw new Error(`Issue ${id} not found`);
		}
		throw new Error(`Failed to fetch issue: ${response.statusText}`);
	}

	const data = await response.json();
	return data.issue;
}

/**
 * Fetch issue statistics
 */
export async function fetchStats(): Promise<IssueStats> {
	const response = await fetch(`${API_BASE}/stats`);
	if (!response.ok) {
		throw new Error(`Failed to fetch stats: ${response.statusText}`);
	}

	const data = await response.json();
	return data.stats;
}

/**
 * Fetch ready work (issues with no blockers)
 */
export async function fetchReady(): Promise<Issue[]> {
	const response = await fetch(`${API_BASE}/ready`);
	if (!response.ok) {
		throw new Error(`Failed to fetch ready issues: ${response.statusText}`);
	}

	const data = await response.json();
	return data.issues || [];
}

/**
 * Check RPC connection status
 */
export async function fetchConnectionStatus(): Promise<{ connected: boolean; status: string }> {
	const response = await fetch(`${API_BASE}/status`);
	if (!response.ok) {
		throw new Error(`Failed to fetch connection status: ${response.statusText}`);
	}

	return response.json();
}
