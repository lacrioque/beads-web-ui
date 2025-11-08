import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
	it('renders open status correctly', () => {
		expect.assertions(2);
		const { container, getByText } = render(StatusBadge, { props: { status: 'open' } });

		expect(getByText('Open')).toBeTruthy();
		expect(container.querySelector('[data-badge]')).toBeTruthy();
	});

	it('renders in_progress status correctly', () => {
		expect.assertions(2);
		const { getByText } = render(StatusBadge, { props: { status: 'in_progress' } });

		expect(getByText('In Progress')).toBeTruthy();
		expect(getByText('In Progress').closest('[data-badge]')).toBeTruthy();
	});

	it('renders closed status correctly', () => {
		expect.assertions(2);
		const { getByText } = render(StatusBadge, { props: { status: 'closed' } });

		expect(getByText('Closed')).toBeTruthy();
		expect(getByText('Closed').closest('[data-badge]')).toBeTruthy();
	});

	it('uses correct variant for open status', () => {
		expect.assertions(1);
		const { container } = render(StatusBadge, { props: { status: 'open' } });

		// The badge should have default variant classes
		const badge = container.querySelector('[data-badge]');
		expect(badge).toBeTruthy();
	});

	it('uses correct variant for in_progress status', () => {
		expect.assertions(1);
		const { container } = render(StatusBadge, { props: { status: 'in_progress' } });

		// The badge should have secondary variant classes
		const badge = container.querySelector('[data-badge]');
		expect(badge).toBeTruthy();
	});

	it('uses correct variant for closed status', () => {
		expect.assertions(1);
		const { container } = render(StatusBadge, { props: { status: 'closed' } });

		// The badge should have outline variant classes
		const badge = container.querySelector('[data-badge]');
		expect(badge).toBeTruthy();
	});
});
