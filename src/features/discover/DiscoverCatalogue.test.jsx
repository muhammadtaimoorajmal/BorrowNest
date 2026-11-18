import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import DiscoverPage from './pages/DiscoverPage';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { EXAMPLE_CATALOGUE } from './data/exampleCatalogue';

describe('Curated Example Catalogue & First-Time Visitor Experience (Module 06)', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_Catalogue_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('renders introductory hero, honest local empty state, and 10 curated example items on first visit', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);

    // Product introduction hero
    expect(
      screen.getByText('Share what you own. Borrow what you need.'),
    ).toBeInTheDocument();

    // Honest empty state for 0 local listings
    expect(await screen.findByRole('heading', { name: /No items listed yet/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/0 items in local catalog/i);

    // Curated example catalogue section
    expect(
      screen.getByRole('heading', { name: /Explore Community Equipment \(10 Example Items\)/i }),
    ).toBeInTheDocument();

    // All 10 example items are rendered in the DOM
    for (const item of EXAMPLE_CATALOGUE) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }

    // Example badges are displayed on cards
    const demoBadges = screen.getAllByText('Example Item');
    expect(demoBadges.length).toBe(10);
  });

  it('filters curated example items reactively by keyword search including specifications', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByRole('heading', { name: /No items listed yet/i });

    const searchInput = screen.getByRole('searchbox', { name: /Search local catalog/i });

    // 1. Search by title
    fireEvent.change(searchInput, { target: { value: 'drill' } });
    expect(screen.getByText(/20V MAX Cordless Compact Drill/i)).toBeInTheDocument();
    expect(screen.queryByText(/6-Person Family Cabin Camping Tent/i)).not.toBeInTheDocument();

    // 2. Search by specification (USB-C)
    fireEvent.change(searchInput, { target: { value: 'USB-C' } });
    expect(screen.getByText(/Rechargeable Precision Electric Screwdriver/i)).toBeInTheDocument();
    expect(screen.queryByText(/20V MAX Cordless Compact Drill/i)).not.toBeInTheDocument();

    // 3. Clear search restores all 10 items
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/20V MAX Cordless Compact Drill/i)).toBeInTheDocument();
    expect(screen.getByText(/6-Person Family Cabin Camping Tent/i)).toBeInTheDocument();
  });

  it('filters curated example items by category pills and resets cleanly', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByRole('heading', { name: /No items listed yet/i });

    // Filter by Gardening
    const gardeningPill = screen.getByRole('button', { name: /^Gardening$/i });
    fireEvent.click(gardeningPill);

    expect(screen.getByText(/Bypass Pruning Shears/i)).toBeInTheDocument();
    expect(screen.getByText(/18V Cordless Garden Hedge Trimmer/i)).toBeInTheDocument();
    expect(screen.queryByText(/20V MAX Cordless Compact Drill/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/6-Person Family Cabin Camping Tent/i)).not.toBeInTheDocument();

    // Reset with "All Categories"
    const allPill = screen.getByRole('button', { name: /All Categories/i });
    fireEvent.click(allPill);

    expect(screen.getByText(/20V MAX Cordless Compact Drill/i)).toBeInTheDocument();
    expect(screen.getByText(/6-Person Family Cabin Camping Tent/i)).toBeInTheDocument();
  });

  it('opens example ItemDetailModal with curated specifications, photo, and demo disclaimer', async () => {
    let navigatedToLending = false;
    render(
      <DiscoverPage
        adapter={adapter}
        onNavigateToLending={() => {
          navigatedToLending = true;
        }}
      />,
    );
    await screen.findByRole('heading', { name: /No items listed yet/i });

    const viewBtn = screen.getByRole('button', {
      name: /View details for 20V MAX Cordless Compact Drill\/Driver/i,
    });
    fireEvent.click(viewBtn);

    const dialog = screen.getByRole('dialog', {
      name: /20V MAX Cordless Compact Drill\/Driver/i,
    });
    expect(dialog).toBeInTheDocument();

    const modalContent = within(dialog);

    // Demonstrates clear demo notice banner
    expect(modalContent.getByText(/Curated Demonstration Item/i)).toBeInTheDocument();
    expect(
      modalContent.getByText(
        /This item is part of BorrowNest.*example catalogue/i,
      ),
    ).toBeInTheDocument();

    // Displays specifications and suggested use case
    expect(modalContent.getByText(/Key Specifications/i)).toBeInTheDocument();
    expect(modalContent.getByText(/Voltage: 20V MAX/i)).toBeInTheDocument();
    expect(modalContent.getByText(/Potential Use Case/i)).toBeInTheDocument();

    // Section 8.1: Confirms zero fabricated neighbourhood areas are displayed
    expect(modalContent.queryByText(/Greenwood/i)).not.toBeInTheDocument();
    expect(modalContent.queryByText(/Maple Ridge/i)).not.toBeInTheDocument();

    // Safe interaction handshake: does NOT render "Request to Borrow"
    expect(modalContent.queryByRole('button', { name: /Request to Borrow/i })).not.toBeInTheDocument();

    // Provides action to add genuine item in Lending
    const addOwnBtn = modalContent.getByRole('button', { name: /Add Your Own Item in Lending/i });
    fireEvent.click(addOwnBtn);
    expect(navigatedToLending).toBe(true);
  });

  it('strictly isolates demonstration items from IndexedDB persistence', async () => {
    const { unmount: unmountFirst } = render(
      <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />,
    );
    await screen.findByRole('heading', { name: /No items listed yet/i });

    // Confirm IndexedDB has zero items stored
    const storedItems = await adapter.getAllItems();
    expect(storedItems.length).toBe(0);

    unmountFirst();

    // Now create a real item in IndexedDB
    await adapter.createItem({
      id: 'real-community-item-1',
      title: 'Bosch Professional Laser Level',
      description: 'Self-leveling cross-line laser with clamp mount.',
      category: 'TOOLS',
      conditionGrade: 5,
      approximateArea: 'Eastwood',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Re-render
    const { unmount: unmountSecond } = render(
      <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />,
    );
    expect(await screen.findByText('Bosch Professional Laser Level')).toBeInTheDocument();

    // Real item does NOT have Example Item badge
    const realCard = screen.getByText('Bosch Professional Laser Level').closest('article');
    expect(within(realCard).queryByText('Example Item')).not.toBeInTheDocument();
    expect(within(realCard).getByText('Available')).toBeInTheDocument();

    // Example catalogue items are still accessible below
    expect(screen.getByText(/20V MAX Cordless Compact Drill/i)).toBeInTheDocument();

    unmountSecond();
  });
});
