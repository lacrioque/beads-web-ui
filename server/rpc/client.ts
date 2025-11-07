/**
 * RPC Client for beads daemon
 * Connects to the daemon via Unix socket and provides methods for database operations
 */

import net from 'net';
import { EventEmitter } from 'events';

export interface RPCRequest {
	method: string;
	params?: unknown;
	id?: string | number;
}

export interface RPCResponse<T = unknown> {
	result?: T;
	error?: {
		code: number;
		message: string;
	};
	id?: string | number;
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
	private requestId = 0;
	private pendingRequests = new Map<string | number, {
		resolve: (value: unknown) => void;
		reject: (error: Error) => void;
	}>();
	private buffer = '';
	private connected = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;

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

		console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

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
		const pending = this.pendingRequests.get(response.id!);
		if (pending) {
			this.pendingRequests.delete(response.id!);

			if (response.error) {
				pending.reject(new Error(response.error.message));
			} else {
				pending.resolve(response.result);
			}
		}
	}

	/**
	 * Send RPC request
	 */
	private async request<T = unknown>(method: string, params?: unknown): Promise<T> {
		if (!this.socket || !this.connected) {
			throw new Error('Not connected to daemon');
		}

		const id = ++this.requestId;
		const request: RPCRequest = { method, params, id };

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });

			// Send request as newline-delimited JSON
			this.socket!.write(JSON.stringify(request) + '\n');

			// Timeout after 30 seconds
			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id);
					reject(new Error('Request timeout'));
				}
			}, 30000);
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
		return this.request<Issue[]>('list', filters);
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
		return this.request<IssueStats>('stats');
	}

	/**
	 * Get ready work (no blockers)
	 */
	async getReady(): Promise<Issue[]> {
		return this.request<Issue[]>('ready');
	}

	/**
	 * Get mutation events since a specific event ID
	 */
	async getMutations(sinceId: number = 0): Promise<MutationEvent[]> {
		return this.request<MutationEvent[]>('mutations', { since: sinceId });
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

		this.connected = false;
		this.pendingRequests.clear();
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connected;
	}
}
