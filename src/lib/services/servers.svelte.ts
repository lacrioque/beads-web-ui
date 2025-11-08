/**
 * Server management service for multi-server support
 * Stores and manages multiple beads server connections
 */

export interface Server {
	id: string;
	name: string;
	url: string;
	active: boolean;
}

const STORAGE_KEY = 'beads-servers';
const ACTIVE_SERVER_KEY = 'beads-active-server';

class ServerManager {
	servers = $state<Server[]>([]);
	activeServerId = $state<string | null>(null);

	constructor() {
		// Load servers from localStorage on initialization
		if (typeof window !== 'undefined') {
			this.loadFromStorage();
		}
	}

	/**
	 * Load servers from localStorage
	 */
	private loadFromStorage(): void {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			const activeId = localStorage.getItem(ACTIVE_SERVER_KEY);

			if (stored) {
				this.servers = JSON.parse(stored);
			} else {
				// Initialize with default local server
				this.servers = [
					{
						id: 'default',
						name: 'Local Server',
						url: 'http://localhost:2325',
						active: true
					}
				];
				this.saveToStorage();
			}

			// Set active server
			if (activeId && this.servers.find((s) => s.id === activeId)) {
				this.activeServerId = activeId;
			} else if (this.servers.length > 0) {
				this.activeServerId = this.servers[0].id;
			}
		} catch (error) {
			console.error('Failed to load servers from storage:', error);
			// Fallback to default
			this.servers = [
				{
					id: 'default',
					name: 'Local Server',
					url: 'http://localhost:2325',
					active: true
				}
			];
			this.activeServerId = 'default';
		}
	}

	/**
	 * Save servers to localStorage
	 */
	private saveToStorage(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.servers));
			if (this.activeServerId) {
				localStorage.setItem(ACTIVE_SERVER_KEY, this.activeServerId);
			}
		} catch (error) {
			console.error('Failed to save servers to storage:', error);
		}
	}

	/**
	 * Get the currently active server
	 */
	getActiveServer(): Server | null {
		if (!this.activeServerId) return null;
		return this.servers.find((s) => s.id === this.activeServerId) || null;
	}

	/**
	 * Get active server URL
	 */
	getActiveServerUrl(): string {
		const active = this.getActiveServer();
		return active ? active.url : 'http://localhost:2325';
	}

	/**
	 * Add a new server
	 */
	addServer(server: Omit<Server, 'id'>): Server {
		const newServer: Server = {
			...server,
			id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		};

		this.servers = [...this.servers, newServer];
		this.saveToStorage();

		// If this is the first server or set as active, make it active
		if (server.active || this.servers.length === 1) {
			this.setActiveServer(newServer.id);
		}

		return newServer;
	}

	/**
	 * Update an existing server
	 */
	updateServer(id: string, updates: Partial<Omit<Server, 'id'>>): void {
		const index = this.servers.findIndex((s) => s.id === id);
		if (index === -1) return;

		this.servers[index] = {
			...this.servers[index],
			...updates
		};
		this.servers = [...this.servers]; // Trigger reactivity
		this.saveToStorage();

		// If set as active, switch to it
		if (updates.active) {
			this.setActiveServer(id);
		}
	}

	/**
	 * Remove a server
	 */
	removeServer(id: string): void {
		// Don't allow removing the last server
		if (this.servers.length <= 1) {
			console.warn('Cannot remove the last server');
			return;
		}

		this.servers = this.servers.filter((s) => s.id !== id);
		this.saveToStorage();

		// If we removed the active server, switch to the first available
		if (this.activeServerId === id) {
			if (this.servers.length > 0) {
				this.setActiveServer(this.servers[0].id);
			} else {
				this.activeServerId = null;
			}
		}
	}

	/**
	 * Set the active server
	 */
	setActiveServer(id: string): void {
		const server = this.servers.find((s) => s.id === id);
		if (!server) return;

		this.activeServerId = id;

		// Update active flag on all servers
		this.servers = this.servers.map((s) => ({
			...s,
			active: s.id === id
		}));

		this.saveToStorage();
	}

	/**
	 * Get all servers
	 */
	getAllServers(): Server[] {
		return this.servers;
	}
}

// Singleton instance
export const serverManager = new ServerManager();
