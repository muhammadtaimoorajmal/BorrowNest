import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import App from '../App';
import Navbar from './Navbar';
import { IndexedDbStorageAdapter } from '../services/storage/IndexedDbStorageAdapter';

describe('Navigation Subsystem', () => {
  const originalHash = window.location.hash;
  let testAdapter;

  beforeEach(async () => {
    window.location.hash = '#lending';
    testAdapter = new IndexedDbStorageAdapter(null, 'BorrowNest_Navigation_Test');
    await testAdapter.initialize();
    await testAdapter.clearAllItems();
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('renders standalone Navbar with all four destinations', () => {
    let selectedRoute = 'lending';
    const onNavigate = (route) => {
      selectedRoute = route;
    };

    render(<Navbar currentSection={selectedRoute} onNavigate={onNavigate} />);

    // Check desktop and mobile nav landmarks
    expect(screen.getByRole('navigation', { name: /Main Navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Mobile Bottom Navigation/i })).toBeInTheDocument();

    // Check all 4 items exist
    const discoverLinks = screen.getAllByRole('link', { name: /Discover/i });
    const borrowingLinks = screen.getAllByRole('link', { name: /Borrowing/i });
    const lendingLinks = screen.getAllByRole('link', { name: /Lending/i });
    const accountLinks = screen.getAllByRole('link', { name: /Account/i });

    expect(discoverLinks.length).toBeGreaterThanOrEqual(1);
    expect(borrowingLinks.length).toBeGreaterThanOrEqual(1);
    expect(lendingLinks.length).toBeGreaterThanOrEqual(1);
    expect(accountLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('indicates the active route with aria-current="page"', () => {
    const { rerender } = render(<Navbar currentSection="lending" onNavigate={() => {}} />);

    const activeLinks = screen.getAllByRole('link', { current: 'page' });
    expect(activeLinks.length).toBe(2); // One in desktop header, one in mobile bottom bar
    expect(activeLinks[0]).toHaveAttribute('href', '#lending');

    rerender(<Navbar currentSection="account" onNavigate={() => {}} />);
    const updatedActiveLinks = screen.getAllByRole('link', { current: 'page' });
    expect(updatedActiveLinks.length).toBe(2);
    expect(updatedActiveLinks[0]).toHaveAttribute('href', '#account');
  });

  it('integrates seamlessly with App hash routing', async () => {
    await act(async () => {
      render(<App adapter={testAdapter} />);
    });

    // Default route is #lending
    expect(await screen.findByRole('heading', { name: /Lending Workspace/i })).toBeInTheDocument();

    // Navigate to Account & Backup via hash change
    await act(async () => {
      window.location.hash = '#account';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByRole('heading', { name: /Account & Local Data Management/i })).toBeInTheDocument();

    // Navigate to Discover placeholder
    await act(async () => {
      window.location.hash = '#discover';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByRole('heading', { name: /Item Discovery & Catalog/i })).toBeInTheDocument();

    // Navigate to Borrowing placeholder
    await act(async () => {
      window.location.hash = '#borrowing';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByRole('heading', { name: /Borrowing Requests & Coordination/i })).toBeInTheDocument();
  });
});
