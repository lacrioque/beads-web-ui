# Beads RPC Client

TypeScript RPC client for communicating with the beads daemon via Unix socket.

## Overview

The RPC client provides a clean interface for interacting with the beads daemon, handling:
- Unix socket connections
- Automatic reconnection with exponential backoff
- JSON-RPC style request/response handling
- Event-driven architecture for connection state changes

## Usage

### Basic Usage

```typescript
import { BeadsRPCClient } from './rpc/client.js';

const client = new BeadsRPCClient('/tmp/beads-daemon.sock');

// Connect to daemon
await client.connect();

// List all issues
const issues = await client.listIssues();

// Get a specific issue
const issue = await client.getIssue('issue-id');

// Get statistics
const stats = await client.getStats();

// Get ready work (no blockers)
const ready = await client.getReady();

// Disconnect
client.disconnect();
```

### Using the Connection Manager

The connection manager provides a singleton instance of the RPC client across your application:

```typescript
import { initializeRPCClient, getRPCClient } from './rpc/connection-manager.js';

// Initialize once at app startup
await initializeRPCClient(config);

// Get client anywhere in your app
const client = getRPCClient();
const issues = await client.listIssues();
```

## API Methods

### `connect(): Promise<void>`
Connect to the beads daemon socket. Throws an error if connection fails.

### `listIssues(filters?): Promise<Issue[]>`
List all issues with optional filters.

**Filters:**
- `status`: Filter by status (open, in_progress, closed)
- `priority`: Filter by priority (P1, P2, P3)
- `type`: Filter by issue type

**Example:**
```typescript
const openP1Issues = await client.listIssues({
  status: 'open',
  priority: 'P1'
});
```

### `getIssue(id: string): Promise<Issue>`
Get a specific issue by ID.

### `getStats(): Promise<IssueStats>`
Get issue statistics including counts by status, priority, and type.

### `getReady(): Promise<Issue[]>`
Get issues that are ready to work on (no blockers).

### `getMutations(sinceId?: number): Promise<MutationEvent[]>`
Get mutation events since a specific event ID. Used for real-time updates.

### `disconnect(): void`
Disconnect from the daemon and clean up resources.

### `isConnected(): boolean`
Check if currently connected to the daemon.

## Events

The RPC client extends EventEmitter and emits the following events:

### `connected`
Emitted when successfully connected to the daemon.

```typescript
client.on('connected', () => {
  console.log('Connected to daemon');
});
```

### `disconnected`
Emitted when disconnected from the daemon.

```typescript
client.on('disconnected', () => {
  console.log('Disconnected from daemon');
});
```

### `error`
Emitted when an error occurs.

```typescript
client.on('error', (error) => {
  console.error('RPC error:', error);
});
```

## Reconnection Behavior

The client automatically attempts to reconnect when disconnected:

- Maximum 5 reconnection attempts
- Exponential backoff starting at 2 seconds
- Maximum delay of 30 seconds between attempts
- Resets counter on successful connection

## Error Handling

All RPC methods throw errors that should be caught:

```typescript
try {
  const issues = await client.listIssues();
} catch (error) {
  if (error.message === 'Not connected to daemon') {
    // Handle disconnection
  } else {
    // Handle other errors
  }
}
```

## Type Definitions

### Issue
```typescript
interface Issue {
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
```

### IssueStats
```typescript
interface IssueStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
}
```

### MutationEvent
```typescript
interface MutationEvent {
  id: number;
  timestamp: string;
  operation: 'create' | 'update' | 'delete';
  issue_id: string;
}
```

## Integration with Koa Server

The RPC client is integrated with the Koa server at startup:

```typescript
// server/index.ts
import { initializeRPCClient, closeRPCClient } from './rpc/connection-manager.js';

// Initialize at startup
await initializeRPCClient(config);

// Use in routes
import { getRPCClient } from './rpc/connection-manager.js';
const client = getRPCClient();

// Clean up on shutdown
closeRPCClient();
```

## Troubleshooting

### Connection Refused
If you see `ENOENT` errors, the daemon socket doesn't exist. Make sure the daemon is running:
```bash
bd daemon
```

### Daemon Not Running
The client will continue to attempt reconnection. Start the daemon and the client will automatically connect.

### Request Timeout
Requests timeout after 30 seconds. This may indicate:
- Daemon is overloaded
- Socket communication issues
- Daemon has stopped responding

## Future Enhancements

- [ ] Support for batched requests
- [ ] Request cancellation
- [ ] Connection pooling
- [ ] Request queue management
- [ ] Metrics and monitoring
