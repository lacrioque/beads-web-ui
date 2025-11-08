/**
 * Server configuration management
 * Handles environment variables and configuration for the Koa server
 */

import path from 'path';

export interface ServerConfig {
	port: number;
	host: string;
	beadsDaemonSocket: string;
	nodeEnv: string;
	staticPath: string;
	buildPath: string;
}

/**
 * Load configuration from environment variables with sensible defaults
 */
export function loadConfig(): ServerConfig {
	// Default socket path is .beads/bd.sock in the current working directory
	const defaultSocketPath = path.join(process.cwd(), '.beads', 'bd.sock');

	return {
		port: parseInt(process.env.PORT || '3000', 10),
		host: process.env.HOST || '0.0.0.0',
		beadsDaemonSocket: process.env.BEADS_DAEMON_SOCKET || defaultSocketPath,
		nodeEnv: process.env.NODE_ENV || 'development',
		staticPath: process.env.STATIC_PATH || 'build/client',
		buildPath: process.env.BUILD_PATH || 'build'
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
