import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import PriorityBadge from './PriorityBadge.svelte';

describe('PriorityBadge', () => {
	it('renders P1 priority correctly', () => {
		expect.assertions(2);
		const { container, getByText } = render(PriorityBadge, { props: { priority: 'P1' } });

		expect(getByText('P1')).toBeTruthy();
		expect(container.querySelector('[data-badge]')).toBeTruthy();
	});

	it('renders P2 priority correctly', () => {
		expect.assertions(2);
		const { getByText } = render(PriorityBadge, { props: { priority: 'P2' } });

		expect(getByText('P2')).toBeTruthy();
		expect(getByText('P2').closest('[data-badge]')).toBeTruthy();
	});

	it('renders P3 priority correctly', () => {
		expect.assertions(2);
		const { getByText } = render(PriorityBadge, { props: { priority: 'P3' } });

		expect(getByText('P3')).toBeTruthy();
		expect(getByText('P3').closest('[data-badge]')).toBeTruthy();
	});

	it('applies correct color classes for P1', () => {
		expect.assertions(1);
		const { container } = render(PriorityBadge, { props: { priority: 'P1' } });

		const badge = container.querySelector('[data-badge]');
		expect(badge?.className).toContain('bg-red-100');
	});

	it('applies correct color classes for P2', () => {
		expect.assertions(1);
		const { container } = render(PriorityBadge, { props: { priority: 'P2' } });

		const badge = container.querySelector('[data-badge]');
		expect(badge?.className).toContain('bg-orange-100');
	});

	it('applies correct color classes for P3', () => {
		expect.assertions(1);
		const { container } = render(PriorityBadge, { props: { priority: 'P3' } });

		const badge = container.querySelector('[data-badge]');
		expect(badge?.className).toContain('bg-yellow-100');
	});
});
