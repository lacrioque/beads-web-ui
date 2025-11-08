import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach } from 'vitest';
import IssueCard from './IssueCard.svelte';

describe('IssueCard', () => {
	const mockIssue = {
		id: 'TEST-123',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open' as const,
		priority: 'P1' as const,
		type: 'task' as const,
		created: '2025-01-01T00:00:00Z',
		updated: '2025-01-02T00:00:00Z'
	};

	afterEach(() => {
		cleanup();
	});

	it('renders issue information correctly', () => {
		expect.assertions(3);
		const { getByText } = render(IssueCard, {
			props: { issue: mockIssue }
		});

		expect(getByText('TEST-123')).toBeTruthy();
		expect(getByText('Test Issue')).toBeTruthy();
		expect(getByText('P1')).toBeTruthy();
	});

	it('displays status badge', () => {
		expect.assertions(1);
		const { container } = render(IssueCard, {
			props: { issue: mockIssue }
		});

		const badges = container.querySelectorAll('[data-badge]');
		const statusBadge = Array.from(badges).find((badge) => badge.textContent?.includes('Open'));
		expect(statusBadge).toBeTruthy();
	});

	it('displays type badge when type is provided', () => {
		expect.assertions(1);
		const { container } = render(IssueCard, {
			props: { issue: mockIssue }
		});

		const typeSpan = container.querySelector('.bg-purple-50');
		expect(typeSpan?.textContent?.trim()).toBe('task');
	});

	it('does not display type badge when type is not provided', () => {
		expect.assertions(1);
		const issueWithoutType = { ...mockIssue, type: undefined };
		const { container } = render(IssueCard, {
			props: { issue: issueWithoutType }
		});

		const typeSpan = container.querySelector('.bg-purple-50');
		expect(typeSpan).toBeFalsy();
	});

	it('calls onclick handler when clicked', async () => {
		expect.assertions(1);
		const handleClick = vi.fn();
		const { container } = render(IssueCard, {
			props: { issue: mockIssue, onclick: handleClick }
		});

		const card = container.querySelector('[role="button"]');
		if (card) {
			await fireEvent.click(card);
		}

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('calls onclick handler when Enter key is pressed', async () => {
		expect.assertions(1);
		const handleClick = vi.fn();
		const { container } = render(IssueCard, {
			props: { issue: mockIssue, onclick: handleClick }
		});

		const card = container.querySelector('[role="button"]');
		if (card) {
			await fireEvent.keyDown(card, { key: 'Enter' });
		}

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('calls onclick handler when Space key is pressed', async () => {
		expect.assertions(1);
		const handleClick = vi.fn();
		const { container } = render(IssueCard, {
			props: { issue: mockIssue, onclick: handleClick }
		});

		const card = container.querySelector('[role="button"]');
		if (card) {
			await fireEvent.keyDown(card, { key: ' ' });
		}

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('is keyboard accessible with tabindex', () => {
		expect.assertions(1);
		const { container } = render(IssueCard, {
			props: { issue: mockIssue }
		});

		const card = container.querySelector('[role="button"]');
		expect(card?.getAttribute('tabindex')).toBe('0');
	});

	it('has hover styles applied', () => {
		expect.assertions(1);
		const { container } = render(IssueCard, {
			props: { issue: mockIssue }
		});

		const card = container.querySelector('[role="button"]');
		expect(card?.className).toContain('hover:shadow-md');
	});
});
