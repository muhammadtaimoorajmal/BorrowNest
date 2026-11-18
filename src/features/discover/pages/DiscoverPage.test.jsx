import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import DiscoverPage from './DiscoverPage';
import { IndexedDbStorageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';

describe('DiscoverPage: Unified Item Discovery Subsystem (DR-01)', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, 'BorrowNest_Discover_Test');
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  const dummyItems = [
    {
      id: 'item-tool-1',
      title: 'Cordless Brushless Hammer Drill',
      description: '20V hammer drill with heavy duty 1/2-inch metal ratcheting chuck.',
      category: 'TOOLS',
      conditionGrade: 4,
      conditionNotes: 'Light scuffs on chuck collar, motor runs smooth.',
      approximateArea: 'North Hills / Oak District',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [
        {
          id: 'photo-1',
          dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
          altText: 'Side angle of compact hammer drill',
        },
      ],
    },
    {
      id: 'item-garden-2',
      title: 'Electric Lawn Mower 40V',
      description: 'Cordless mulching mower with grass bag attachment and dual batteries.',
      category: 'GARDENING',
      conditionGrade: 5,
      conditionNotes: 'Like new, blades freshly sharpened.',
      approximateArea: 'West End / Riverbend',
      availability: 'UNAVAILABLE',
      status: 'ACTIVE',
      photos: [
        {
          id: 'photo-2',
          dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
          altText: 'Electric push lawn mower',
        },
      ],
    },
    {
      id: 'item-outdoor-3',
      title: 'Camping Tent 4-Person Waterproof',
      description: 'Double wall dome tent with rainfly, stakes, and carry bag.',
      category: 'OUTDOOR',
      conditionGrade: 3,
      conditionNotes: 'Minor dirt on ground tarp, seam taped and watertight.',
      approximateArea: 'Highland Park / Main Gates',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [
        {
          id: 'photo-3',
          dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
          altText: '4-person dome tent pitched in grass',
        },
      ],
    },
    {
      id: 'item-archived-4',
      title: 'Archived Broken Ladder',
      description: 'Aluminum stepladder no longer in service.',
      category: 'TOOLS',
      conditionGrade: 1,
      approximateArea: 'South Suburbs',
      availability: 'UNAVAILABLE',
      status: 'ARCHIVED',
      photos: [],
    },
  ];

  it('renders honest empty state when local storage contains 0 active items', async () => {
    let navigatedToLending = false;
    render(
      <DiscoverPage
        adapter={adapter}
        onNavigateToLending={() => {
          navigatedToLending = true;
        }}
      />,
    );

    // Initial heading
    expect(await screen.findByRole('heading', { name: /Item Discovery & Catalog/i })).toBeInTheDocument();

    // Honest empty state
    expect(await screen.findByRole('heading', { name: /No items listed yet/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Your local BorrowNest catalog does not have any active items/i),
    ).toBeInTheDocument();

    // Verify empty live status
    expect(screen.getByRole('status')).toHaveTextContent(/0 items in local catalog/i);

    // Click "Go to Lending Workspace"
    const actionBtn = screen.getByRole('button', { name: /Go to Lending Workspace/i });
    fireEvent.click(actionBtn);
    expect(navigatedToLending).toBe(true);
  });

  it('renders active items in read-only cards and excludes archived items', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);

    // Shows active items
    expect(await screen.findByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();

    // Never displays archived item
    expect(screen.queryByText('Archived Broken Ladder')).not.toBeInTheDocument();

    // Shows correct result count in live region
    expect(screen.getByRole('status')).toHaveTextContent(/Showing 3 of 3 items/i);

    // Cards must NOT contain owner management controls
    expect(screen.queryByRole('button', { name: /Edit listing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Archive/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('filters reactively by keyword search across title, description, and location', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    const searchInput = screen.getByRole('searchbox', { name: /Search local catalog/i });

    // 1. Search by title keyword
    fireEvent.change(searchInput, { target: { value: 'drill' } });
    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.queryByText('Electric Lawn Mower 40V')).not.toBeInTheDocument();
    expect(screen.queryByText('Camping Tent 4-Person Waterproof')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Showing 1 of 3 items/i);

    // 2. Search by description keyword
    fireEvent.change(searchInput, { target: { value: 'mulching' } });
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
    expect(screen.queryByText('Cordless Brushless Hammer Drill')).not.toBeInTheDocument();

    // 3. Search by approximate area
    fireEvent.change(searchInput, { target: { value: 'Highland Park' } });
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();
    expect(screen.queryByText('Electric Lawn Mower 40V')).not.toBeInTheDocument();

    // 4. Clear search with clear button
    const clearBtn = screen.getByRole('button', { name: /Clear search input/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();
  });

  it('filters by category pills and resets cleanly', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    // Click Tools pill
    const toolsPill = screen.getByRole('button', { name: /^Tools$/i });
    expect(toolsPill).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toolsPill);
    expect(toolsPill).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.queryByText('Electric Lawn Mower 40V')).not.toBeInTheDocument();
    expect(screen.queryByText('Camping Tent 4-Person Waterproof')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Showing 1 of 3 items/i);

    // Click All Categories pill
    const allPill = screen.getByRole('button', { name: /All Categories/i });
    fireEvent.click(allPill);
    expect(allPill).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();
  });

  it('filters by availability facet toggle', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    const availableCheckbox = screen.getByLabelText(/Available now only/i);
    expect(availableCheckbox).not.toBeChecked();

    fireEvent.click(availableCheckbox);
    expect(availableCheckbox).toBeChecked();

    // Drill and Tent are AVAILABLE, Mower is UNAVAILABLE
    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();
    expect(screen.queryByText('Electric Lawn Mower 40V')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Showing 2 of 3 items/i);

    // Uncheck
    fireEvent.click(availableCheckbox);
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
  });

  it('displays honest no-results state and allows one-click recovery via Reset all filters', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    const searchInput = screen.getByRole('searchbox', { name: /Search local catalog/i });
    fireEvent.change(searchInput, { target: { value: 'telescope observatory' } });

    // Shows no results feedback
    expect(await screen.findByRole('heading', { name: /No matching items found/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Showing 0 of 3 items/i);

    // Reset filters button
    const resetBtn = screen.getByRole('button', { name: /Reset all filters/i });
    fireEvent.click(resetBtn);

    // All items restored
    expect(screen.getByText('Cordless Brushless Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText('Electric Lawn Mower 40V')).toBeInTheDocument();
    expect(screen.getByText('Camping Tent 4-Person Waterproof')).toBeInTheDocument();
    expect(searchInput.value).toBe('');
  });

  it('opens and closes ItemDetailModal dialog with complete item data', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    const viewBtn = screen.getByRole('button', {
      name: /View details for Cordless Brushless Hammer Drill/i,
    });
    fireEvent.click(viewBtn);

    // Modal dialog is opened
    const dialog = screen.getByRole('dialog', { name: /Cordless Brushless Hammer Drill/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Shows full description and notes inside the modal dialog
    const modalContent = within(dialog);
    expect(modalContent.getByText(/heavy duty 1\/2-inch metal ratcheting chuck/i)).toBeInTheDocument();
    expect(modalContent.getByText(/Light scuffs on chuck collar, motor runs smooth/i)).toBeInTheDocument();
    expect(modalContent.getByText(/North Hills \/ Oak District/i)).toBeInTheDocument();

    // Shows Request to Borrow action
    expect(modalContent.getByRole('button', { name: /Request to Borrow/i })).toBeInTheDocument();

    // Close using close button
    const closeBtn = modalContent.getByRole('button', { name: /Close item details/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes ItemDetailModal on Escape key', async () => {
    for (const item of dummyItems) {
      await adapter.createItem(item);
    }

    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByText('Cordless Brushless Hammer Drill');

    const viewBtn = screen.getByRole('button', {
      name: /View details for Cordless Brushless Hammer Drill/i,
    });
    fireEvent.click(viewBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
