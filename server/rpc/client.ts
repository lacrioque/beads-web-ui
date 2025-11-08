/**
 * RPC Client for beads daemon
 * Connects to the daemon via Unix socket and provides methods for database operations
 */

import net from 'net';
import { EventEmitter } from 'events';

export interface RPCRequest {
	operation: string;
	args?: unknown;
	request_id?: string | number;
}

export interface RPCResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

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

export interface MutationEvent {
	id: number;
	timestamp: string;
	operation: 'create' | 'update' | 'delete';
	issue_id: string;
}

/**
 * RPC Client for beads daemon communication
 */
export class BeadsRPCClient extends EventEmitter {
	private socket: net.Socket | null = null;
	private socketPath: string;
	private pendingRequest: {
		resolve: (value: unknown) => void;
		reject: (error: Error) => void;
		timeout: NodeJS.Timeout;
	} | null = null;
	private requestQueue: Array<{
		request: RPCRequest;
		resolve: (value: unknown) => void;
		reject: (error: Error) => void;
	}> = [];
	private buffer = '';
	private connected = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private processing = false;

	constructor(socketPath: string) {
		super();
		this.socketPath = socketPath;
	}

	/**
	 * Connect to the beads daemon socket
	 */
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.socket && this.connected) {
				resolve();
				return;
			}

			this.socket = net.createConnection({ path: this.socketPath });

			this.socket.on('connect', () => {
				this.connected = true;
				this.reconnectAttempts = 0;
				console.log(`✓ Connected to beads daemon at ${this.socketPath}`);
				this.emit('connected');
				resolve();
			});

			this.socket.on('data', (data) => {
				this.handleData(data);
			});

			this.socket.on('error', (error) => {
				console.error('Socket error:', error);
				this.emit('error', error);
				if (!this.connected) {
					reject(error);
				}
			});

			this.socket.on('close', () => {
				this.connected = false;
				console.log('Disconnected from beads daemon');
				this.emit('disconnected');
				this.attemptReconnect();
			});
		});
	}

	/**
	 * Attempt to reconnect to the daemon
	 */
	private attemptReconnect(): void {
		if (this.reconnectTimer) {
			return;
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

		console.log(
			`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect().catch((error) => {
				console.error('Reconnection failed:', error);
			});
		}, delay);
	}

	/**
	 * Handle incoming data from socket
	 */
	private handleData(data: Buffer): void {
		this.buffer += data.toString();

		// Process complete JSON messages (newline-delimited)
		const lines = this.buffer.split('\n');
		this.buffer = lines.pop() || '';

		for (const line of lines) {
			if (line.trim()) {
				try {
					const response: RPCResponse = JSON.parse(line);
					this.handleResponse(response);
				} catch (error) {
					console.error('Failed to parse RPC response:', error);
				}
			}
		}
	}

	/**
	 * Handle RPC response
	 */
	private handleResponse(response: RPCResponse): void {
		if (!this.pendingRequest) {
			console.warn('Received response but no pending request');
			return;
		}

		const { resolve, reject, timeout } = this.pendingRequest;
		clearTimeout(timeout);
		this.pendingRequest = null;

		if (response.error) {
			reject(new Error(response.error));
		} else if (response.success) {
			resolve(response.data);
		} else {
			reject(new Error('Request failed with no error message'));
		}

		// Process next request in queue
		this.processQueue();
	}

	/**
	 * Process the next request in the queue
	 */
	private processQueue(): void {
		if (this.processing || this.pendingRequest || this.requestQueue.length === 0) {
			return;
		}

		this.processing = true;
		const next = this.requestQueue.shift()!;
		this.processing = false;

		this.sendRequest(next.request, next.resolve, next.reject);
	}

	/**
	 * Send a request immediately (assumes no pending request)
	 */
	private sendRequest(
		request: RPCRequest,
		resolve: (value: unknown) => void,
		reject: (error: Error) => void
	): void {
		if (!this.socket || !this.connected) {
			reject(new Error('Not connected to daemon'));
			return;
		}

		// Send request as newline-delimited JSON
		this.socket.write(JSON.stringify(request) + '\n');

		// Set up timeout
		const timeout = setTimeout(() => {
			if (this.pendingRequest) {
				this.pendingRequest = null;
				reject(new Error('Request timeout'));
				this.processQueue();
			}
		}, 30000);

		this.pendingRequest = { resolve: resolve as (value: unknown) => void, reject, timeout };
	}

	/**
	 * Send RPC request (queued)
	 */
	private async request<T = unknown>(operation: string, args?: unknown): Promise<T> {
		if (!this.socket || !this.connected) {
			throw new Error('Not connected to daemon');
		}

		const request: RPCRequest = { operation, args };

		return new Promise((resolve, reject) => {
			// If no pending request, send immediately
			if (!this.pendingRequest) {
				this.sendRequest(request, resolve, reject);
			} else {
				// Otherwise, queue it
				this.requestQueue.push({ request, resolve: resolve as (value: unknown) => void, reject });
			}
		});
	}

	/**
	 * List all issues
	 */
	async listIssues(filters?: {
		status?: string;
		priority?: string;
		type?: string;
	}): Promise<Issue[]> {
		// Convert filters to match beads daemon ListArgs structure
		const args = filters
			? {
					status: filters.status,
					priority: filters.priority ? parseInt(filters.priority.substring(1)) : undefined,
					issue_type: filters.type
				}
			: {};

		return this.request<Issue[]>('list', args);
	}

	/**
	 * Get a specific issue by ID
	 */
	async getIssue(id: string): Promise<Issue> {
		return this.request<Issue>('show', { id });
	}

	/**
	 * Get issue statistics
	 */
	async getStats(): Promise<IssueStats> {
		return this.request<IssueStats>('stats', {});
	}

	/**
	 * Get ready work (no blockers)
	 */
	async getReady(): Promise<Issue[]> {
		return this.request<Issue[]>('ready', {});
	}

	/**
	 * Get mutation events since a specific timestamp
	 */
	async getMutations(sinceTimestamp: number = 0): Promise<MutationEvent[]> {
		return this.request<MutationEvent[]>('get_mutations', { since: sinceTimestamp });
	}

	/**
	 * Disconnect from daemon
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}

		// Clear pending request and queue
		if (this.pendingRequest) {
			clearTimeout(this.pendingRequest.timeout);
			this.pendingRequest.reject(new Error('Client disconnected'));
			this.pendingRequest = null;
		}

		// Clear request queue
		for (const queued of this.requestQueue) {
			queued.reject(new Error('Client disconnected'));
		}
		this.requestQueue = [];

		this.connected = false;
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connected;
	}
}
