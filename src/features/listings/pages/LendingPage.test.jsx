import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LendingPage from './LendingPage';
import { IndexedDbStorageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';

describe('LendingPage UI and Item Lifecycle', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, 'BorrowNest_LendingPage_Test');
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('renders honest empty state when no items exist', async () => {
    render(<LendingPage adapter={adapter} />);

    const emptyTitle = await screen.findByRole('heading', {
      name: /No items listed yet/i,
    });
    expect(emptyTitle).toBeInTheDocument();
    expect(screen.getByText(/Total Owned/i)).toBeInTheDocument();
  });

  it('opens and closes the create item form dialog', async () => {
    render(<LendingPage adapter={adapter} />);

    const addBtn = await screen.findByRole('button', { name: /Add new item listing/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Create Item Listing/i })).not.toBeInTheDocument();
    });
  });

  it('displays field-level validation errors when submitting empty form', async () => {
    render(<LendingPage adapter={adapter} />);

    const addBtn = await screen.findByRole('button', { name: /Add new item listing/i });
    fireEvent.click(addBtn);

    const submitBtn = screen.getByRole('button', { name: /Create Listing/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Item title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Item description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/General pickup area is required/i)).toBeInTheDocument();
  });

  it('successfully creates, edits, archives, and deletes an item', async () => {
    // Seed one valid item directly in adapter to test full lifecycle interactions
    await adapter.createItem({
      id: 'item-lifecycle-test',
      title: 'Camping Tent 4-Person',
      description: 'Waterproof 4-person family camping tent with rainfly and ground stakes.',
      category: 'OUTDOOR',
      conditionGrade: 5,
      conditionNotes: 'Like new, pitched once in backyard.',
      approximateArea: 'Pineview Valley / Near Trailhead',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [
        {
          id: 'photo-1',
          dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
          altText: 'Erected green camping tent on grassy lawn',
          mimeType: 'image/webp',
          width: 800,
          height: 600,
          sizeBytes: 1500,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<LendingPage adapter={adapter} />);

    // Item card should render
    expect(await screen.findByText('Camping Tent 4-Person')).toBeInTheDocument();
    expect(screen.getByText('Condition: Like New')).toBeInTheDocument();

    // Toggle Availability
    const toggleBtn = screen.getByRole('button', { name: /Mark Camping Tent 4-Person unavailable/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Archive Listing
    const archiveBtn = screen.getByRole('button', { name: /Archive Camping Tent 4-Person/i });
    fireEvent.click(archiveBtn);

    // Active tab is now empty
    await waitFor(() => {
      expect(screen.getByText(/No items listed yet/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Switch to Archived Tab
    const archivedTab = screen.getByRole('tab', { name: /Archived/i });
    fireEvent.click(archivedTab);

    expect(await screen.findByText('Camping Tent 4-Person', {}, { timeout: 3000 })).toBeInTheDocument();

    // Restore Listing
    const restoreBtn = screen.getByRole('button', { name: /Restore Camping Tent 4-Person/i });
    fireEvent.click(restoreBtn);

    // Switch back to Active Tab
    const activeTab = screen.getByRole('tab', { name: /Active Listings/i });
    fireEvent.click(activeTab);
    expect(await screen.findByText('Camping Tent 4-Person', {}, { timeout: 3000 })).toBeInTheDocument();

    // Delete with Confirmation
    const deleteBtn = screen.getByRole('button', { name: /Delete Camping Tent 4-Person/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: /Permanently Delete Listing\?/i })).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Permanently Delete/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('Camping Tent 4-Person')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
