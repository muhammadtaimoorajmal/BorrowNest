import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import DiscoverPage from './pages/DiscoverPage';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { EXAMPLE_CATALOGUE } from './data/exampleCatalogue';

describe('Curated Example Catalogue & First-Time Visitor Experience (Module 08)', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_Catalogue_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('renders introductory hero, honest local empty state, and 20 curated example items on first visit', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);

    // Product introduction hero
    expect(
      screen.getByText('Share what you own. Borrow what you need.'),
    ).toBeInTheDocument();

    // Honest empty state for 0 local listings
    expect(await screen.findByRole('heading', { name: /No items listed yet/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Your local listings: 0/i);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 20 items/i);

    // Curated example catalogue section
    expect(
      screen.getByRole('heading', { name: /Explore 20 Example Items/i }),
    ).toBeInTheDocument();

    // All 20 example items are rendered in the DOM
    expect(EXAMPLE_CATALOGUE.length).toBe(20);
    for (const item of EXAMPLE_CATALOGUE) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }

    // Example badges are displayed on cards
    const demoBadges = screen.getAllByText('Example Item');
    expect(demoBadges.length).toBe(20);
  });

  it('filters curated example items reactively by keyword search across all categories', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByRole('heading', { name: /No items listed yet/i });

    const searchInput = screen.getByRole('searchbox', { name: /Search local catalog/i });

    // 1. Search by title keyword (Tools: drill)
    fireEvent.change(searchInput, { target: { value: 'drill' } });
    expect(screen.getByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
    expect(screen.queryByText('Family Cabin Camping Tent')).not.toBeInTheDocument();

    // 2. Search new item: Impact Driver
    fireEvent.change(searchInput, { target: { value: 'impact driver' } });
    expect(screen.getByText('Cordless Impact Driver')).toBeInTheDocument();
    expect(screen.queryByText('Cordless Compact Drill/Driver')).not.toBeInTheDocument();

    // 3. Search new item: Lawn Mower
    fireEvent.change(searchInput, { target: { value: 'mower' } });
    expect(screen.getByText('Push Lawn Mower')).toBeInTheDocument();

    // 4. Search new item: Leaf Blower
    fireEvent.change(searchInput, { target: { value: 'blower' } });
    expect(screen.getByText('Cordless Leaf Blower')).toBeInTheDocument();

    // 5. Search new item: Steamer
    fireEvent.change(searchInput, { target: { value: 'steamer' } });
    expect(screen.getByText('Handheld Garment Steamer')).toBeInTheDocument();

    // 6. Search new item: Air Purifier
    fireEvent.change(searchInput, { target: { value: 'purifier' } });
    expect(screen.getByText('Portable Tower Air Purifier')).toBeInTheDocument();

    // 7. Search new item: Projector
    fireEvent.change(searchInput, { target: { value: 'projector' } });
    expect(screen.getByText('Portable HD Movie Projector')).toBeInTheDocument();

    // 8. Search new item: Power Station
    fireEvent.change(searchInput, { target: { value: 'power station' } });
    expect(screen.getByText('Portable Battery Power Station')).toBeInTheDocument();

    // 9. Clear search restores all 20 items
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
    expect(screen.getByText('Family Cabin Camping Tent')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 20 items/i);
  });

  it('filters curated example items by category pills with accurate 5/4/4/4/3 distribution', async () => {
    render(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />);
    await screen.findByRole('heading', { name: /No items listed yet/i });

    // 1. Filter by Tools (5 items)
    const toolsPill = screen.getByRole('button', { name: /^Tools$/i });
    fireEvent.click(toolsPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 5 of 20 items/i);
    expect(screen.getByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
    expect(screen.getByText('Rechargeable Precision Electric Screwdriver Kit')).toBeInTheDocument();
    expect(screen.getByText('Household Hand Tool & Socket Set')).toBeInTheDocument();
    expect(screen.getByText('Cordless Impact Driver')).toBeInTheDocument();
    expect(screen.getByText('Wet and Dry Workshop Vacuum')).toBeInTheDocument();

    // 2. Filter by Gardening (4 items)
    const gardeningPill = screen.getByRole('button', { name: /^Gardening$/i });
    fireEvent.click(gardeningPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 4 of 20 items/i);
    expect(screen.getByText('Bypass Pruning Shears & Branch Trimmer')).toBeInTheDocument();
    expect(screen.getByText('Cordless Garden Hedge Trimmer')).toBeInTheDocument();
    expect(screen.getByText('Push Lawn Mower')).toBeInTheDocument();
    expect(screen.getByText('Cordless Leaf Blower')).toBeInTheDocument();

    // 3. Filter by Household (4 items)
    const householdPill = screen.getByRole('button', { name: /^Household$/i });
    fireEvent.click(householdPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 4 of 20 items/i);
    expect(screen.getByText('Household Sewing & Mending Machine')).toBeInTheDocument();
    expect(screen.getByText('Portable Carpet & Upholstery Spot Cleaner')).toBeInTheDocument();
    expect(screen.getByText('Handheld Garment Steamer')).toBeInTheDocument();
    expect(screen.getByText('Portable Tower Air Purifier')).toBeInTheDocument();

    // 4. Filter by Outdoor (4 items)
    const outdoorPill = screen.getByRole('button', { name: /^Outdoor$/i });
    fireEvent.click(outdoorPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 4 of 20 items/i);
    expect(screen.getByText('Family Cabin Camping Tent')).toBeInTheDocument();
    expect(screen.getByText('Portable Camping Gas Stove')).toBeInTheDocument();
    expect(screen.getByText('Folding Portable Camping Chairs (Set)')).toBeInTheDocument();
    expect(screen.getByText('Portable Folding Camping Table')).toBeInTheDocument();

    // 5. Filter by Electronics (3 items)
    const electronicsPill = screen.getByRole('button', { name: /^Electronics$/i });
    fireEvent.click(electronicsPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 3 of 20 items/i);
    expect(screen.getByText('Portable HD Movie Projector')).toBeInTheDocument();
    expect(screen.getByText('Portable Wireless Bluetooth Speaker')).toBeInTheDocument();
    expect(screen.getByText('Portable Battery Power Station')).toBeInTheDocument();

    // 6. Reset with "All Categories" restores 20
    const allPill = screen.getByRole('button', { name: /All Categories/i });
    fireEvent.click(allPill);
    expect(screen.getByRole('status')).toHaveTextContent(/Example catalogue: 20 items/i);
  });

  it('opens example ItemDetailModal with curated specifications, photo, and demo disclaimer without condition tiers', async () => {
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
      name: /View details for Cordless Compact Drill\/Driver/i,
    });
    fireEvent.click(viewBtn);

    const dialog = screen.getByRole('dialog', {
      name: /Cordless Compact Drill\/Driver/i,
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
    expect(modalContent.getAllByText(/Keyless ratcheting chuck/i).length).toBeGreaterThanOrEqual(1);
    expect(modalContent.getByText(/Potential Use Case/i)).toBeInTheDocument();

    // Section 9: Confirms zero fabricated condition inspection tiers or condition notes are displayed
    expect(modalContent.getByText(/Status Notice/i)).toBeInTheDocument();
    expect(modalContent.getByText(/Illustrative example only\. No real owner, live availability or physical condition inspection is represented\./i)).toBeInTheDocument();
    expect(modalContent.queryByText(/Tier 4\/5/i)).not.toBeInTheDocument();
    expect(modalContent.queryByText(/Sample observation/i)).not.toBeInTheDocument();

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
    expect(screen.getByText('Cordless Compact Drill/Driver')).toBeInTheDocument();

    unmountSecond();
  });
});
