/**
 * Server configuration management
 * Handles environment variables and configuration for the Koa server
 */

export interface ServerConfig {
	port: number;
	host: string;
	beadsDaemonSocket: string;
	nodeEnv: string;
	staticPath: string;
}

/**
 * Load configuration from environment variables with sensible defaults
 */
export function loadConfig(): ServerConfig {
	return {
		port: parseInt(process.env.PORT || '3000', 10),
		host: process.env.HOST || '0.0.0.0',
		beadsDaemonSocket: process.env.BEADS_DAEMON_SOCKET || '/tmp/beads-daemon.sock',
		nodeEnv: process.env.NODE_ENV || 'development',
		staticPath: process.env.STATIC_PATH || 'build/client'
	};
}

/**
 * Validate configuration
 */
export function validateConfig(config: ServerConfig): void {
	if (config.port < 1 || config.port > 65535) {
		throw new Error(`Invalid port: ${config.port}. Must be between 1 and 65535`);
	}

	if (!config.host) {
		throw new Error('Host cannot be empty');
	}

	if (!config.beadsDaemonSocket) {
		throw new Error('Beads daemon socket path is required');
	}
}
