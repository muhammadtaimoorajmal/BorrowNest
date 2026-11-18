import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LendingPage from './LendingPage';
import { IndexedDbStorageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';
import { formatDateRange } from '../../borrowing/services/dateRange';

describe('LendingPage UI and Item Lifecycle', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, `BorrowNest_LendingPage_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await adapter.initialize();
    await adapter.clearAllItems();
    if (typeof adapter.clearAllBorrowRequests === 'function') {
      await adapter.clearAllBorrowRequests();
    }
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
    // 1. Create an isolated valid item fixture inside the test suite only
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

    // 2. Verify it is initially ACTIVE
    expect(await screen.findByText('Camping Tent 4-Person')).toBeInTheDocument();
    expect(screen.getByText('Condition: Like New')).toBeInTheDocument();
    const initialItem = await adapter.getItemById('item-lifecycle-test');
    expect(initialItem.status).toBe('ACTIVE');

    // 3. Change its availability to UNAVAILABLE
    const toggleBtn = screen.getByRole('button', { name: /Mark Camping Tent 4-Person unavailable/i });
    fireEvent.click(toggleBtn);

    // 4. Wait for that update to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark Camping Tent 4-Person available/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    const toggledItem = await adapter.getItemById('item-lifecycle-test');
    expect(toggledItem.availability).toBe('UNAVAILABLE');

    // 5. Click Archive
    const archiveBtn = screen.getByRole('button', { name: /Archive Camping Tent 4-Person/i });
    fireEvent.click(archiveBtn);

    // 6, 7, 8. Wait for storage mutation to complete; retrieve directly from IndexedDB; verify status is ARCHIVED
    await waitFor(async () => {
      const archivedInDb = await adapter.getItemById('item-lifecycle-test');
      expect(archivedInDb.status).toBe('ARCHIVED');
    }, { timeout: 3000 });

    // 9. Verify it is absent from Active Listings
    await waitFor(() => {
      expect(screen.getByText(/No items listed yet/i)).toBeInTheDocument();
      expect(screen.queryByText('Camping Tent 4-Person')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // 10. Navigate to Archived
    const archivedTab = screen.getByRole('tab', { name: /Archived/i });
    fireEvent.click(archivedTab);

    // 11. Verify it appears in Archived Listings
    expect(await screen.findByText('Camping Tent 4-Person', {}, { timeout: 3000 })).toBeInTheDocument();

    // 12. Restore it
    const restoreBtn = screen.getByRole('button', { name: /Restore Camping Tent 4-Person/i });
    fireEvent.click(restoreBtn);

    // 13. Verify its status returns to ACTIVE in IndexedDB
    await waitFor(async () => {
      const restoredInDb = await adapter.getItemById('item-lifecycle-test');
      expect(restoredInDb.status).toBe('ACTIVE');
    }, { timeout: 3000 });

    // 14. Switch back to Active Tab and verify it appears in Active Listings again
    const activeTab = screen.getByRole('tab', { name: /Active Listings/i });
    fireEvent.click(activeTab);
    expect(await screen.findByText('Camping Tent 4-Person', {}, { timeout: 3000 })).toBeInTheDocument();

    // Final Lifecycle Verification: Delete with Confirmation
    const deleteBtn = screen.getByRole('button', { name: /Delete Camping Tent 4-Person/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: /Permanently Delete Listing\?/i })).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Permanently Delete/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('Camping Tent 4-Person')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders incoming requests tab with pending badge count and permits owner decisions', async () => {
    const item = await adapter.createItem({
      id: 'lending-item-req-test',
      title: 'Pressure Washer 1800 PSI',
      description: 'Compact washer with turbo nozzle.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'South Park',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await adapter.createBorrowRequest({
      id: 'req-lending-test-1',
      itemId: item.id,
      borrowerAlias: 'Casey Stone',
      startDate: '2026-12-10',
      endDate: '2026-12-14',
    });

    render(<LendingPage adapter={adapter} />);

    // Verify Incoming Requests tab badge displays 1
    const reqTab = await screen.findByRole('tab', { name: /Incoming Requests 1/i });
    expect(reqTab).toBeInTheDocument();

    // Click tab
    fireEvent.click(reqTab);

    // Verify request details are shown
    expect(await screen.findByText('Casey Stone')).toBeInTheDocument();
    expect(screen.getByText(formatDateRange('2026-12-10', '2026-12-14'))).toBeInTheDocument();

    // Click Approve
    const approveBtn = screen.getByRole('button', { name: /Approve Request/i });
    fireEvent.click(approveBtn);

    // Confirmation dialog
    expect(screen.getByRole('heading', { name: /Approve Borrowing Request/i })).toBeInTheDocument();
    const modalApproveBtn = screen.getAllByRole('button', { name: /Approve Request/i })[1];
    fireEvent.click(modalApproveBtn);

    // Verifies status changed to APPROVED
    await waitFor(async () => {
      const updatedReq = await adapter.getBorrowRequestById('req-lending-test-1');
      expect(updatedReq.status).toBe('APPROVED');
    });
  });

  it('blocks deleting item with request history and displays helpful error banner', async () => {
    const item = await adapter.createItem({
      id: 'item-with-history',
      title: 'Circular Saw 7-1/4 inch',
      description: 'Powerful saw with carbide blade.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'North Bay',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a borrowing request for this item
    await adapter.createBorrowRequest({
      id: 'req-history-1',
      itemId: item.id,
      borrowerAlias: 'Saw Borrower',
      startDate: '2026-12-15',
      endDate: '2026-12-18',
    });

    render(<LendingPage adapter={adapter} />);

    expect(await screen.findByText('Circular Saw 7-1/4 inch')).toBeInTheDocument();

    // Attempt to delete
    const deleteBtn = screen.getByRole('button', { name: /Delete Circular Saw 7-1\/4 inch/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: /Permanently Delete Listing\?/i })).toBeInTheDocument();
    const confirmDeleteBtn = screen.getByRole('button', { name: /Permanently Delete/i });
    fireEvent.click(confirmDeleteBtn);

    // Must display error banner blocking deletion
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot delete item.*associated borrowing request/i);

    // Item must still exist in DB
    const itemInDb = await adapter.getItemById('item-with-history');
    expect(itemInDb).toBeDefined();
  });

  it('blocks archiving item with active approved reservation and displays error', async () => {
    const item = await adapter.createItem({
      id: 'item-with-approved-res',
      title: 'Lawn Aerator Roller',
      description: 'Heavy duty spiked lawn aerator.',
      category: 'GARDENING',
      conditionGrade: 4,
      approximateArea: 'Greenwood',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = await adapter.createBorrowRequest({
      id: 'approved-res-1',
      itemId: item.id,
      borrowerAlias: 'Lawn Care Pro',
      startDate: '2026-12-15',
      endDate: '2026-12-18',
    });
    await adapter.approveBorrowRequest(req.id);

    render(<LendingPage adapter={adapter} />);

    expect(await screen.findByText('Lawn Aerator Roller')).toBeInTheDocument();

    // Attempt to archive
    const archiveBtn = screen.getByRole('button', { name: /Archive Lawn Aerator Roller/i });
    fireEvent.click(archiveBtn);

    // Must display error banner blocking archive
    expect(await screen.findByRole('alert')).toHaveTextContent(/active or approved reservation/i);

    // Item must still be ACTIVE
    const itemInDb = await adapter.getItemById('item-with-approved-res');
    expect(itemInDb.status).toBe('ACTIVE');
  });

  it('permits archiving item when associated loan is COMPLETED', async () => {
    const item = await adapter.createItem({
      id: 'item-completed-loan',
      title: 'Power Pressure Washer',
      description: 'Electric pressure washer 2000 PSI.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'Greenwood',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await adapter.mergeAllData({
      items: [],
      requests: [
        {
          id: 'completed-req-1',
          itemId: item.id,
          borrowerAlias: 'Pat Taylor',
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          status: 'APPROVED',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-03T18:00:00.000Z',
        },
      ],
      loans: [
        {
          requestId: 'completed-req-1',
          itemId: item.id,
          status: 'COMPLETED',
          collectionDate: '2026-11-01',
          returnDeadline: '2026-11-03',
          collectedAt: '2026-11-01T10:00:00.000Z',
          completedAt: '2026-11-03T18:00:00.000Z',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-03T18:00:00.000Z',
        },
      ],
    });

    render(<LendingPage adapter={adapter} />);

    expect(await screen.findByText('Power Pressure Washer')).toBeInTheDocument();

    // Archive should succeed because loan is COMPLETED
    const archiveBtn = screen.getByRole('button', { name: /Archive Power Pressure Washer/i });
    fireEvent.click(archiveBtn);

    await waitFor(async () => {
      const updated = await adapter.getItemById('item-completed-loan');
      expect(updated.status).toBe('ARCHIVED');
    });
  });

  it('renders Items Lent Out tab with active loan and opens handover modal', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const futureStr = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

    const item = await adapter.createItem({
      id: 'item-for-lent-tab',
      title: 'Post Hole Digger',
      description: 'Heavy steel digger.',
      category: 'GARDENING',
      conditionGrade: 4,
      approximateArea: 'Greenwood',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = await adapter.createBorrowRequest({
      itemId: item.id,
      borrowerAlias: 'Fence Builder',
      startDate: todayStr,
      endDate: futureStr,
    });
    await adapter.approveBorrowRequest(req.id);

    render(<LendingPage adapter={adapter} />);

    // Click on "Items Lent Out" tab
    const loansTab = await screen.findByRole('tab', { name: /Items Lent Out/i });
    fireEvent.click(loansTab);

    expect(await screen.findByText('Fence Builder')).toBeInTheDocument();
    expect(screen.getByText('Reserved')).toBeInTheDocument();

    const recordHandoverBtn = screen.getByRole('button', { name: /Record Handover/i });
    fireEvent.click(recordHandoverBtn);

    expect(await screen.findByText(/Physical Handover Recording/i)).toBeInTheDocument();
  });
});
