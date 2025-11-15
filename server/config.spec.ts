/**
 * Unit tests for server configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig } from './config.js';
import type { ServerConfig } from './config.js';

describe('Server Configuration', () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe('loadConfig', () => {
		it('should load default configuration when no env vars are set', () => {
			// Clear relevant env vars
			delete process.env.PORT;
			delete process.env.HOST;
			delete process.env.BEADS_DAEMON_SOCKET;
			delete process.env.NODE_ENV;
			delete process.env.STATIC_PATH;
			delete process.env.BUILD_PATH;

			const config = loadConfig();

			expect(config.port).toBe(3000);
			expect(config.host).toBe('0.0.0.0');
			expect(config.nodeEnv).toBe('development');
			expect(config.staticPath).toBe('build/client');
			expect(config.buildPath).toBe('build');
			expect(config.beadsDaemonSocket).toContain('.beads/bd.sock');
		});

		it('should load configuration from environment variables', () => {
			process.env.PORT = '8080';
			process.env.HOST = 'localhost';
			process.env.BEADS_DAEMON_SOCKET = '/custom/path/bd.sock';
			process.env.NODE_ENV = 'production';
			process.env.STATIC_PATH = 'dist/client';
			process.env.BUILD_PATH = 'dist';

			const config = loadConfig();

			expect(config.port).toBe(8080);
			expect(config.host).toBe('localhost');
			expect(config.beadsDaemonSocket).toBe('/custom/path/bd.sock');
			expect(config.nodeEnv).toBe('production');
			expect(config.staticPath).toBe('dist/client');
			expect(config.buildPath).toBe('dist');
		});

		it('should parse PORT as integer', () => {
			process.env.PORT = '9000';

			const config = loadConfig();

			expect(config.port).toBe(9000);
			expect(typeof config.port).toBe('number');
		});
	});

	describe('validateConfig', () => {
		it('should validate a valid configuration', () => {
			const validConfig: ServerConfig = {
				port: 3000,
				host: 'localhost',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(validConfig)).not.toThrow();
		});

		it('should throw error for port less than 1', () => {
			const invalidConfig: ServerConfig = {
				port: 0,
				host: 'localhost',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(invalidConfig)).toThrow('Invalid port: 0');
		});

		it('should throw error for port greater than 65535', () => {
			const invalidConfig: ServerConfig = {
				port: 65536,
				host: 'localhost',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(invalidConfig)).toThrow('Invalid port: 65536');
		});

		it('should throw error for empty host', () => {
			const invalidConfig: ServerConfig = {
				port: 3000,
				host: '',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(invalidConfig)).toThrow('Host cannot be empty');
		});

		it('should throw error for empty daemon socket path', () => {
			const invalidConfig: ServerConfig = {
				port: 3000,
				host: 'localhost',
				beadsDaemonSocket: '',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(invalidConfig)).toThrow(
				'Beads daemon socket path is required'
			);
		});

		it('should accept valid port boundaries', () => {
			const minPortConfig: ServerConfig = {
				port: 1,
				host: 'localhost',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			const maxPortConfig: ServerConfig = {
				port: 65535,
				host: 'localhost',
				beadsDaemonSocket: '/path/to/socket',
				nodeEnv: 'development',
				staticPath: 'build/client',
				buildPath: 'build'
			};

			expect(() => validateConfig(minPortConfig)).not.toThrow();
			expect(() => validateConfig(maxPortConfig)).not.toThrow();
		});
	});
});
