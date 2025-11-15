# CI/CD Documentation

This document describes the continuous integration and deployment setup for the beads-web-monitor project.

## Overview

The project uses GitHub Actions for CI/CD with the following workflows:

- **CI Workflow** (`.github/workflows/ci.yml`) - Runs on every push and pull request
- **Release Workflow** (`.github/workflows/release.yml`) - Creates releases when version tags are pushed
- **Dependabot** (`.github/dependabot.yml`) - Automated dependency updates

## CI Workflow

The CI workflow runs four parallel jobs on every push to `main` or `develop` branches and on all pull requests:

### Jobs

1. **Lint** - Code quality checks
   - Runs `bun run lint`
   - Checks code formatting with Prettier
   - Checks for ESLint violations

2. **Type Check** - TypeScript validation
   - Runs `bun run check`
   - Validates TypeScript types with svelte-check

3. **Test** - Runs test suite
   - Installs Playwright browsers for component tests
   - Runs `bun run test`
   - Executes both unit and integration tests

4. **Build** - Production build verification
   - Runs `bun run build`
   - Uploads build artifacts (retained for 7 days)
   - Verifies the project can be built successfully

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

## Release Workflow

The release workflow automatically creates GitHub releases when you push a version tag.

### Creating a Release

1. Update the version in `package.json`:
   ```bash
   # Example: update to version 1.0.0
   ```

2. Commit the version change:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.0"
   ```

3. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. GitHub Actions will automatically:
   - Run all CI checks (lint, typecheck, test)
   - Build the project
   - Generate a changelog from git commits
   - Create a release archive (.tar.gz)
   - Create a GitHub release with release notes
   - Attach the build artifacts to the release

### Tag Format

Tags must follow semantic versioning with a `v` prefix:
- `v1.0.0` - Major release
- `v1.1.0` - Minor release
- `v1.1.1` - Patch release

### Release Artifacts

Each release includes:
- `beads-web-monitor-vX.Y.Z.tar.gz` - Contains:
  - Built application (`build/` directory)
  - `package.json` and `bun.lock`
  - `README.md`
  - `LICENSE` (if present)

### Changelog Generation

The workflow automatically generates a changelog from git commit messages between releases. To get clean changelogs, use conventional commit messages:

```bash
git commit -m "feat: add new dashboard widget"
git commit -m "fix: resolve WebSocket connection issue"
git commit -m "docs: update API documentation"
git commit -m "chore: update dependencies"
```

## Dependabot

Dependabot is configured to:

- Check for npm dependency updates weekly (every Monday)
- Check for GitHub Actions updates weekly (every Monday)
- Group dependencies by type (production vs development)
- Limit open PRs to avoid noise (10 for npm, 5 for Actions)

### Handling Dependabot PRs

1. Review the PR and check for breaking changes
2. Ensure CI passes
3. Test locally if needed:
   ```bash
   gh pr checkout <PR-number>
   bun install
   bun test
   ```
4. Merge if everything looks good

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Run all checks
bun run lint       # Linting
bun run check      # Type checking
bun run test       # Tests
bun run build      # Build

# Or run everything in sequence
bun run lint && bun run check && bun run test && bun run build
```

## CI Status Badges

Add these badges to your README.md to show CI status:

```markdown
[![CI](https://github.com/YOUR_ORG/beads-web-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/beads-web-monitor/actions/workflows/ci.yml)
```

Replace `YOUR_ORG` with your GitHub organization or username.

## Troubleshooting

### CI Fails with "Playwright not installed"

The CI installs Playwright browsers automatically. If tests fail locally:
```bash
bunx playwright install --with-deps chromium
```

### Release workflow fails

Common issues:
- Tag format is incorrect (must be `v*.*.*`)
- CI checks failing before release
- No write permissions to repository

### Dependabot PRs fail CI

- Check if dependencies introduced breaking changes
- Review the dependency's changelog
- May need code updates to accommodate new versions

## Security

- The release workflow requires `contents: write` permission
- Dependabot PRs are automatically security reviewed
- All workflows use pinned action versions for security

## Future Improvements

Potential enhancements to consider:

- [ ] Add code coverage reporting
- [ ] Add performance benchmarking
- [ ] Deploy preview environments for PRs
- [ ] Add security scanning (e.g., Snyk, Dependabot security)
- [ ] Add Docker image builds
- [ ] Add automated changelog generation with semantic-release
