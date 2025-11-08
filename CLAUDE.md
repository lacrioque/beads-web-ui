# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a beads monitoring web application built with SvelteKit, providing a real-time issue tracking dashboard. It connects to a beads daemon via RPC to display and track issues through a clean, responsive web interface. The project uses Svelte 5 for reactivity, Tailwind CSS 4 for styling, and is built as a Node.js application.

## Development Commands

### Running the Development Server

```bash
bun dev
# or with browser open
bun dev -- --open
```

### Building

```bash
bun build        # Creates production build
bun preview      # Preview production build
```

### Testing

```bash
bun test         # Run all tests once
bun test:unit    # Run tests in watch mode
```

The test setup uses Vitest with two separate projects:

- **Client tests**: Files matching `src/**/*.svelte.{test,spec}.{js,ts}` run in Playwright browser environment
- **Server tests**: Files matching `src/**/*.{test,spec}.{js,ts}` (excluding `.svelte.` files) run in Node environment

### Code Quality

```bash
bun lint         # Run prettier check and ESLint
bun format       # Format code with prettier
bun check        # Type-check with svelte-check
bun check:watch  # Type-check in watch mode
```

## Architecture

### SvelteKit Configuration

- **Adapter**: Uses `@sveltejs/adapter-node` for Node.js deployment
- **Preprocessor**: `vitePreprocess` for TypeScript and other transformations
- **Build Tool**: Vite with Tailwind CSS 4 plugin

### Project Structure

- `src/routes/`: SvelteKit routes (file-based routing)
- `src/lib/`: Reusable components and utilities (aliased as `$lib`)
- `src/app.css`: Global styles with Tailwind CSS
- `src/app.html`: HTML template
- `docs/`: Project documentation (see docs/00-General.md and docs/01-WebUI-README.md)

### Key Technologies

- **Svelte 5**: Modern reactivity with runes (`$props()`, `$state()`, etc.)
- **Tailwind CSS 4**: Latest version with Vite plugin
- **TypeScript**: Strict mode enabled
- **Vitest**: Testing framework with browser and Node environments
- **ESLint + Prettier**: Code quality with svelte plugin support

## Testing Strategy

### File Naming Conventions

- **Svelte component tests**: `*.svelte.spec.ts` or `*.svelte.test.ts` (runs in browser)
- **Server/utility tests**: `*.spec.ts` or `*.test.ts` (runs in Node)

### Running Specific Tests

```bash
# Run a specific test file
bun test src/demo.spec.ts

# Run tests in a specific directory
bun test src/routes/

# Run only client tests
bun test --project=client

# Run only server tests
bun test --project=server
```

### Test Assertions

All tests must include assertions (`expect.requireAssertions: true` in config).

## Integration with Beads Daemon

The application is designed to connect to a beads daemon for issue tracking:

- Connects via RPC to Unix socket
- Polls for mutation events and broadcasts via WebSocket
- Provides real-time updates to connected clients
- See docs/01-WebUI-README.md for detailed architecture

## TypeScript Configuration

- Strict mode enabled
- Module resolution: bundler
- Path aliases handled by SvelteKit configuration
- `$lib` alias points to `src/lib/`

## Important Notes

- This project uses bun as the Node runtime and task runner
- Documentation resides in `./docs/` (except CLAUDE.md and README.md)
- The project is built for deployment as a standalone service with Node adapter
- WebSocket support is integral to the real-time monitoring functionality
- Whenever you close an issue on beads that generated code, check if there is a testing epic and add an issue to test the generated code
