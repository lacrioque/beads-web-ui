import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import LoadingSkeleton from './LoadingSkeleton.svelte';

describe('LoadingSkeleton', () => {
	it('renders default card skeleton', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton);

		// Should render at least one skeleton element
		const skeletons = container.querySelectorAll('[data-loading-skeleton]');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('renders specified number of skeletons', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton, {
			props: { count: 3 }
		});

		const skeletons = container.querySelectorAll('[data-loading-skeleton]');
		expect(skeletons.length).toBe(3);
	});

	it('renders stat type skeleton', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton, {
			props: { type: 'stat', count: 4 }
		});

		const skeletons = container.querySelectorAll('[data-loading-skeleton]');
		expect(skeletons.length).toBe(4);
	});

	it('renders list type skeleton', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton, {
			props: { type: 'list', count: 2 }
		});

		// List type renders 1 Card wrapper with multiple list items inside
		const skeletons = container.querySelectorAll('[data-loading-skeleton]');
		expect(skeletons.length).toBe(1);
	});

	it('renders table type skeleton', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton, {
			props: { type: 'table' }
		});

		const skeleton = container.querySelector('[data-loading-skeleton]');
		expect(skeleton).toBeTruthy();
	});

	it('renders card type skeleton by default', () => {
		expect.assertions(1);
		const { container } = render(LoadingSkeleton, {
			props: { count: 1 }
		});

		const skeleton = container.querySelector('[data-loading-skeleton]');
		expect(skeleton).toBeTruthy();
	});
});
