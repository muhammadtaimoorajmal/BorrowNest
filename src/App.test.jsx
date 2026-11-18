import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('BorrowNest Application Shell and Core Navigation', () => {
  it('renders the brand mark and product tagline', async () => {
    render(<App />);

    // Brand and wordmark presence
    const brandOccurrences = screen.getAllByText(/Borrow/i);
    expect(brandOccurrences.length).toBeGreaterThan(0);

    const nestOccurrences = screen.getAllByText(/Nest/i);
    expect(nestOccurrences.length).toBeGreaterThan(0);

    // Check product tagline in footer
    const taglineMatches = screen.getAllByText(
      /Share what you own\. Borrow what you need\./i,
    );
    expect(taglineMatches.length).toBeGreaterThan(0);
  });

  it('honestly displays the empty initial state without synthetic items', async () => {
    render(<App />);

    // Must show genuine empty state title after local storage check
    const emptyTitle = await screen.findByRole('heading', { name: /No items listed yet/i });
    expect(emptyTitle).toBeInTheDocument();

    // Must explain honest local-first state
    expect(
      screen.getByText(
        /Your local BorrowNest library is currently empty/i,
      ),
    ).toBeInTheDocument();

    // Verify absence of fabricated marketplace items
    expect(screen.queryByTestId('fake-item-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/Cordless Hammer Drill/i)).not.toBeInTheDocument();
  });

  it('provides accessible landmark regions, navigation, and skip link', async () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Skip to main content/i }),
    ).toBeInTheDocument();

    // Check four task navigation destinations (DR-06) across responsive navigation
    expect(screen.getAllByRole('link', { name: /Discover/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Borrowing/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Lending/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Account/i }).length).toBeGreaterThan(0);
  });
});
