import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('BorrowNest Application Shell (Module 01)', () => {
  it('renders the brand mark and product tagline', () => {
    render(<App />);

    // Brand and wordmark presence
    const brandOccurrences = screen.getAllByText(/Borrow/i);
    expect(brandOccurrences.length).toBeGreaterThan(0);

    const nestOccurrences = screen.getAllByText(/Nest/i);
    expect(nestOccurrences.length).toBeGreaterThan(0);

    // Check product tagline
    const taglineMatches = screen.getAllByText(
      /Share what you own\. Borrow what you need\./i,
    );
    expect(taglineMatches.length).toBeGreaterThan(0);
  });

  it('honestly displays the empty initial state without synthetic items', () => {
    render(<App />);

    // Must show genuine empty state title
    expect(
      screen.getByRole('heading', { name: /No items listed yet/i }),
    ).toBeInTheDocument();

    // Must explain honest local-first state
    expect(
      screen.getByText(
        /Your local BorrowNest library is currently empty/i,
      ),
    ).toBeInTheDocument();

    // Verify absence of fabricated marketplace items
    expect(screen.queryByTestId('fake-item-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/Drill/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lawnmower/i)).not.toBeInTheDocument();
  });

  it('provides accessible landmark regions and skip link', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Skip to main content/i }),
    ).toBeInTheDocument();
  });
});
