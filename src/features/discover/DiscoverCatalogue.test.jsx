import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import DiscoverPage from './pages/DiscoverPage';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { EXAMPLE_CATALOGUE } from './data/exampleCatalogue';
import { seedDemoMarketplace } from '../demo/services/seedDemoMarketplace';
import { DemoProfileProvider } from '../demo/context/DemoProfileContext';

describe('Curated Example Catalogue & Live Marketplace Discovery (Module Final)', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_Catalogue_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
    await seedDemoMarketplace(adapter);
  });

  it('renders introductory hero and 20 curated example items from IndexedDB single source of truth', async () => {
    render(
      <DemoProfileProvider>
        <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />
      </DemoProfileProvider>,
    );

    // Product introduction hero
    expect(
      screen.getByText('Share what you own. Borrow what you need.'),
    ).toBeInTheDocument();

    // Catalogue status reports 20 items
    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

    // All 20 example items are rendered in the DOM
    expect(EXAMPLE_CATALOGUE.length).toBe(20);
    for (const item of EXAMPLE_CATALOGUE) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }

    // Example badges and live availability badges are displayed on cards
    const demoBadges = screen.getAllByText('Example Item');
    expect(demoBadges.length).toBe(20);

    const availableBadges = screen.getAllByText('Available');
    expect(availableBadges.length).toBe(20);
  });

  it('filters curated example items reactively by keyword search across all categories', async () => {
    render(
      <DemoProfileProvider>
        <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />
      </DemoProfileProvider>,
    );
    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

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
    expect(screen.getByText('Showing 20 of 20 items')).toBeInTheDocument();
  });

  it('filters curated example items by category pills with accurate 5/4/4/4/3 distribution', async () => {
    render(
      <DemoProfileProvider>
        <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />
      </DemoProfileProvider>,
    );
    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

    // 1. Filter by Tools (5 items)
    const toolsPill = screen.getByRole('button', { name: /^Tools$/i });
    fireEvent.click(toolsPill);
    expect(screen.getByText('Showing 5 of 20 items')).toBeInTheDocument();
    expect(screen.getByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
    expect(screen.getByText('Rechargeable Precision Electric Screwdriver Kit')).toBeInTheDocument();
    expect(screen.getByText('Household Hand Tool & Socket Set')).toBeInTheDocument();
    expect(screen.getByText('Cordless Impact Driver')).toBeInTheDocument();
    expect(screen.getByText('Wet and Dry Workshop Vacuum')).toBeInTheDocument();

    // 2. Filter by Gardening (4 items)
    const gardeningPill = screen.getByRole('button', { name: /^Gardening$/i });
    fireEvent.click(gardeningPill);
    expect(screen.getByText('Showing 4 of 20 items')).toBeInTheDocument();
    expect(screen.getByText('Bypass Pruning Shears & Branch Trimmer')).toBeInTheDocument();
    expect(screen.getByText('Cordless Garden Hedge Trimmer')).toBeInTheDocument();
    expect(screen.getByText('Push Lawn Mower')).toBeInTheDocument();
    expect(screen.getByText('Cordless Leaf Blower')).toBeInTheDocument();

    // 3. Filter by Household (4 items)
    const householdPill = screen.getByRole('button', { name: /^Household$/i });
    fireEvent.click(householdPill);
    expect(screen.getByText('Showing 4 of 20 items')).toBeInTheDocument();
    expect(screen.getByText('Household Sewing & Mending Machine')).toBeInTheDocument();
    expect(screen.getByText('Portable Carpet & Upholstery Spot Cleaner')).toBeInTheDocument();
    expect(screen.getByText('Handheld Garment Steamer')).toBeInTheDocument();
    expect(screen.getByText('Portable Tower Air Purifier')).toBeInTheDocument();

    // 4. Filter by Outdoor (4 items)
    const outdoorPill = screen.getByRole('button', { name: /^Outdoor$/i });
    fireEvent.click(outdoorPill);
    expect(screen.getByText('Showing 4 of 20 items')).toBeInTheDocument();
    expect(screen.getByText('Family Cabin Camping Tent')).toBeInTheDocument();
    expect(screen.getByText('Portable Camping Gas Stove')).toBeInTheDocument();
    expect(screen.getByText('Folding Portable Camping Chairs (Set)')).toBeInTheDocument();
    expect(screen.getByText('Portable Folding Camping Table')).toBeInTheDocument();

    // 5. Filter by Electronics (3 items)
    const electronicsPill = screen.getByRole('button', { name: /^Electronics$/i });
    fireEvent.click(electronicsPill);
    expect(screen.getByText('Showing 3 of 20 items')).toBeInTheDocument();
    expect(screen.getByText('Portable HD Movie Projector')).toBeInTheDocument();
    expect(screen.getByText('Portable Wireless Bluetooth Speaker')).toBeInTheDocument();
    expect(screen.getByText('Portable Battery Power Station')).toBeInTheDocument();

    // 6. Reset with "All Categories" restores 20
    const allPill = screen.getByRole('button', { name: /All Categories/i });
    fireEvent.click(allPill);
    expect(screen.getByText('Showing 20 of 20 items')).toBeInTheDocument();
  });

  it('opens example ItemDetailModal with curated specifications, photo, and demo disclaimer', async () => {
    render(
      <DemoProfileProvider>
        <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />
      </DemoProfileProvider>,
    );
    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

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
    expect(modalContent.getAllByText(/Classroom Demonstration Listing/i).length).toBeGreaterThanOrEqual(1);
    expect(
      modalContent.getByText(
        /Availability and borrowing activity are simulated in this browser/i,
      ),
    ).toBeInTheDocument();

    // Displays specifications and suggested use case
    expect(modalContent.getByText(/Key Specifications/i)).toBeInTheDocument();
    expect(modalContent.getAllByText(/Keyless ratcheting chuck/i).length).toBeGreaterThanOrEqual(1);
    expect(modalContent.getByText(/Potential Use Case/i)).toBeInTheDocument();

    // Confirms status and condition info
    expect(modalContent.getByText(/Availability Status/i)).toBeInTheDocument();
    expect(modalContent.getByText(/Condition Inspection/i)).toBeInTheDocument();

    // Evaluator interaction handshake: provides Request to Borrow action
    expect(modalContent.getByRole('button', { name: /Request to Borrow/i })).toBeInTheDocument();
  });

  it('distinguishes user-created listings from curated example items in the single unified grid', async () => {
    // Initially has 20 seeded demo items
    const initialItems = await adapter.getAllItems();
    expect(initialItems.length).toBe(20);

    // Now create a custom user item in IndexedDB
    await adapter.createItem({
      id: 'custom-community-item-1',
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
      isDemo: false,
    });

    render(
      <DemoProfileProvider>
        <DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />
      </DemoProfileProvider>,
    );
    expect(await screen.findByText('Showing 21 of 21 items')).toBeInTheDocument();

    // Real custom item does NOT have Example Item badge
    const customCard = screen.getByText('Bosch Professional Laser Level').closest('article');
    expect(within(customCard).queryByText('Example Item')).not.toBeInTheDocument();
    expect(within(customCard).getByText('Available')).toBeInTheDocument();

    // Demo catalogue item has BOTH Example Item badge and Available badge
    const demoCard = screen.getByText('Cordless Compact Drill/Driver').closest('article');
    expect(within(demoCard).getByText('Example Item')).toBeInTheDocument();
    expect(within(demoCard).getByText('Available')).toBeInTheDocument();
  });
});
