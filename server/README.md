# Beads Web Monitor Server

Custom Koa server for the beads-web-monitor application.

## Architecture

This server provides:

- RESTful API endpoints for beads issue tracking
- WebSocket support for real-time updates
- Static file serving for the SvelteKit client
- RPC client connection to beads daemon

## Directory Structure

```
server/
├── index.ts              # Main Koa server entry point
├── config.ts             # Configuration management
├── middleware/           # Custom middleware
│   ├── error-handler.ts  # Error handling middleware
│   └── logger.ts         # Request logging middleware
└── README.md            # This file
```

## Configuration

The server is configured via environment variables:

| Variable              | Description                          | Default                  |
| --------------------- | ------------------------------------ | ------------------------ |
| `PORT`                | Server port                          | `3000`                   |
| `HOST`                | Server host                          | `0.0.0.0`                |
| `BEADS_DAEMON_SOCKET` | Path to beads daemon Unix socket     | `/tmp/beads-daemon.sock` |
| `NODE_ENV`            | Environment (development/production) | `development`            |
| `STATIC_PATH`         | Path to static files                 | `build/client`           |

## Running the Server

### Development Mode

```bash
bun run dev:server
```

This starts the server with hot reload using `tsx --watch`.

### Production Mode

```bash
bun run build
bun run start
```

## Endpoints

### Health Check

```
GET /health
```

Returns server health status and version information.

**Response:**

```json
{
	"status": "ok",
	"timestamp": "2025-11-07T16:39:36.614Z",
	"version": "0.0.1"
}
```

## Middleware

### Error Handler

Catches and formats errors consistently across the application. In development mode, includes stack traces in error responses.

### Logger

Logs all incoming requests with:

- Timestamp
- HTTP method
- URL path
- Status code
- Response time

Output is color-coded for easy reading in the terminal.

## Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals for graceful shutdown:

1. Stop accepting new connections
2. Complete existing requests
3. Close server after 10 seconds maximum

## Next Steps

- [ ] Implement RPC client for beads daemon connection
- [ ] Add WebSocket server integration
- [ ] Create API routes for issue management
- [ ] Add authentication middleware
- [ ] Implement rate limiting
