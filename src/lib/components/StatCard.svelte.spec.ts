import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard.svelte';

describe('StatCard', () => {
	it('renders label and value correctly', () => {
		expect.assertions(2);
		const { getByText } = render(StatCard, {
			props: { label: 'Total Issues', value: 42 }
		});

		expect(getByText('Total Issues')).toBeTruthy();
		expect(getByText('42')).toBeTruthy();
	});

	it('renders string values correctly', () => {
		expect.assertions(2);
		const { getByText } = render(StatCard, {
			props: { label: 'Completion Rate', value: '75%' }
		});

		expect(getByText('Completion Rate')).toBeTruthy();
		expect(getByText('75%')).toBeTruthy();
	});

	it('applies custom color class to value', () => {
		expect.assertions(1);
		const { container } = render(StatCard, {
			props: { label: 'Active', value: 10, colorClass: 'text-blue-600' }
		});

		const valueElement = container.querySelector('.text-blue-600');
		expect(valueElement?.textContent).toBe('10');
	});

	it('applies default color class when not specified', () => {
		expect.assertions(1);
		const { container } = render(StatCard, {
			props: { label: 'Total', value: 100 }
		});

		const valueElement = container.querySelector('.text-gray-900');
		expect(valueElement?.textContent).toBe('100');
	});

	it('displays loading skeleton when loading prop is true', () => {
		expect.assertions(1);
		const { container } = render(StatCard, {
			props: { label: 'Loading', value: 0, loading: true }
		});

		// Check for skeleton loading element
		const skeleton = container.querySelector('[data-loading-skeleton]');
		expect(skeleton).toBeTruthy();
	});

	it('displays value when loading is false', () => {
		expect.assertions(1);
		const { getByText } = render(StatCard, {
			props: { label: 'Loaded', value: 50, loading: false }
		});

		expect(getByText('50')).toBeTruthy();
	});
});
