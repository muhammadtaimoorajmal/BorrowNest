import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BorrowRequestDialog from './BorrowRequestDialog';
import { IndexedDbStorageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';
import { getLocalToday } from '../services/dateRange';

describe('BorrowRequestDialog UI and Validation', () => {
  let adapter;
  let testItem;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, `BorrowNest_Dialog_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await adapter.initialize();
    await adapter.clearAllItems();

    testItem = await adapter.createItem({
      id: 'dialog-test-item',
      title: 'Rotary Hammer Drill',
      description: 'Heavy duty drill with SDS plus chuck.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'West Heights',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('renders dialog with item summary, form fields, and empty reservations state', async () => {
    render(<BorrowRequestDialog item={testItem} adapter={adapter} onClose={() => {}} />);

    expect(screen.getByRole('dialog', { name: /Request to Borrow/i })).toBeInTheDocument();
    expect(screen.getByText('Rotary Hammer Drill')).toBeInTheDocument();
    expect(screen.getByText(/West Heights/i)).toBeInTheDocument();
    expect(await screen.findByText(/No existing reservations/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Your Name or Alias/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Collection Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Return Deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Note to Owner/i)).toBeInTheDocument();
  });

  it('displays field-level validation errors when submitting empty form', async () => {
    render(<BorrowRequestDialog item={testItem} adapter={adapter} onClose={() => {}} />);

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter a borrower display name/i)).toBeInTheDocument();
    expect(screen.getByText(/Collection date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Return deadline is required/i)).toBeInTheDocument();
  });

  it('validates return deadline is not before collection date', async () => {
    render(<BorrowRequestDialog item={testItem} adapter={adapter} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Sam Fisher' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: '2026-12-10' },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: '2026-12-05' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Return deadline cannot precede the collection date/i),
    ).toBeInTheDocument();
  });

  it('displays existing approved reservations and pre-validates against date overlaps', async () => {
    // Seed an approved reservation
    const existingReq = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'First Borrower',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
    });
    await adapter.approveBorrowRequest(existingReq.id);

    render(<BorrowRequestDialog item={testItem} adapter={adapter} onClose={() => {}} />);

    // Existing reservation should be visible
    expect(await screen.findByText(/Booked:/i)).toBeInTheDocument();

    // Fill candidate overlapping dates: Dec 3 to Dec 8
    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Second Borrower' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: '2026-12-03' },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: '2026-12-08' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    // Should show conflict error
    expect(await screen.findByText(/overlap with an existing reservation/i)).toBeInTheDocument();
  });

  it('successfully submits valid request and displays confirmation view', async () => {
    let navigatedToBorrowing = false;
    let closed = false;

    render(
      <BorrowRequestDialog
        item={testItem}
        adapter={adapter}
        onClose={() => {
          closed = true;
        }}
        onNavigateToBorrowing={() => {
          navigatedToBorrowing = true;
        }}
      />,
    );

    const today = getLocalToday();

    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Morgan Lee' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: today },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: today },
    });
    fireEvent.change(screen.getByLabelText(/Note to Owner/i), {
      target: { value: 'Need for a quick shelf install' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Borrowing Request Submitted!/i)).toBeInTheDocument();
    expect(screen.getByText('Morgan Lee')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();

    // Click View in Borrowing Workspace
    const viewBtn = screen.getByRole('button', { name: /View in Borrowing Workspace/i });
    fireEvent.click(viewBtn);

    expect(closed).toBe(true);
    expect(navigatedToBorrowing).toBe(true);

    // Verify persisted in IndexedDB
    const savedRequests = await adapter.listBorrowRequests({ itemId: testItem.id });
    expect(savedRequests.length).toBe(1);
    expect(savedRequests[0].borrowerAlias).toBe('Morgan Lee');
  });

  it('closes dialog on Escape key', () => {
    let closed = false;
    render(
      <BorrowRequestDialog
        item={testItem}
        adapter={adapter}
        onClose={() => {
          closed = true;
        }}
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});
