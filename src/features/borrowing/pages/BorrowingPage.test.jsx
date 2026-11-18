import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BorrowingPage from './BorrowingPage';
import { IndexedDbStorageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';
import { REQUEST_STATUS } from '../constants/requestStatus';

describe('BorrowingPage UI and Interactions', () => {
  let adapter;
  let testItem;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, `BorrowNest_BorrowingPage_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await adapter.initialize();
    await adapter.clearAllItems();

    testItem = await adapter.createItem({
      id: 'borrowing-page-item-1',
      title: 'Telescoping Ladder 12ft',
      description: 'Aluminum extendable ladder with anti-pinch locks.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'East Hill',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('renders honest empty state for borrower view when 0 requests exist', async () => {
    let navigatedToDiscover = false;

    render(
      <BorrowingPage
        adapter={adapter}
        onNavigateToDiscover={() => {
          navigatedToDiscover = true;
        }}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: /No Borrowing Requests Yet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/You have not submitted any borrowing requests yet/i)).toBeInTheDocument();

    const browseBtn = screen.getByRole('button', { name: /Browse Catalog in Discover/i });
    fireEvent.click(browseBtn);
    expect(navigatedToDiscover).toBe(true);
  });

  it('renders honest empty state for owner view when 0 requests exist', async () => {
    let navigatedToLending = false;

    render(
      <BorrowingPage
        adapter={adapter}
        onNavigateToLending={() => {
          navigatedToLending = true;
        }}
      />,
    );

    const ownerTab = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab);

    expect(
      await screen.findByRole('heading', { name: /No Incoming Requests/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No community members have submitted requests/i)).toBeInTheDocument();

    const manageBtn = screen.getByRole('button', { name: /Manage Items in Lending/i });
    fireEvent.click(manageBtn);
    expect(navigatedToLending).toBe(true);
  });

  it('allows borrower to cancel a PENDING request with confirmation dialog', async () => {
    await adapter.createBorrowRequest({
      id: 'req-to-cancel',
      itemId: testItem.id,
      borrowerAlias: 'Alex Rivera',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      requestNote: 'Cleaning gutters',
    });

    render(<BorrowingPage adapter={adapter} />);

    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText(/Cleaning gutters/i)).toBeInTheDocument();

    // Click Cancel Request button
    const cancelBtn = screen.getByRole('button', { name: /Cancel Request/i });
    fireEvent.click(cancelBtn);

    // Confirmation dialog appears
    expect(screen.getByRole('heading', { name: /Cancel Borrowing Request/i })).toBeInTheDocument();

    // Confirm cancellation
    const confirmBtn = screen.getAllByRole('button', { name: /Cancel Request/i })[1];
    fireEvent.click(confirmBtn);

    // Status updates to CANCELLED
    await waitFor(async () => {
      const updatedReq = await adapter.getBorrowRequestById('req-to-cancel');
      expect(updatedReq.status).toBe(REQUEST_STATUS.CANCELLED);
    });
  });

  it('allows owner to approve a PENDING request and verifies active reservation banner', async () => {
    await adapter.createBorrowRequest({
      id: 'req-to-approve',
      itemId: testItem.id,
      borrowerAlias: 'Taylor Swift',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
    });

    render(<BorrowingPage adapter={adapter} />);

    // Switch to Owner View
    const ownerTab = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab);

    expect(await screen.findByText('Taylor Swift')).toBeInTheDocument();

    // Click Approve Request
    const approveBtn = screen.getByRole('button', { name: /Approve Request/i });
    fireEvent.click(approveBtn);

    // Confirmation dialog
    expect(screen.getByRole('heading', { name: /Approve Borrowing Request/i })).toBeInTheDocument();

    // Confirm
    const modalApproveBtn = screen.getAllByRole('button', { name: /Approve Request/i })[1];
    fireEvent.click(modalApproveBtn);

    // Verifies status became APPROVED and active reservation section displays
    await waitFor(async () => {
      const updated = await adapter.getBorrowRequestById('req-to-approve');
      expect(updated.status).toBe(REQUEST_STATUS.APPROVED);
    });

    expect(await screen.findByText(/Active Scheduled Reservations \(1\)/i)).toBeInTheDocument();
  });

  it('allows owner to decline a PENDING request with confirmation', async () => {
    await adapter.createBorrowRequest({
      id: 'req-to-decline',
      itemId: testItem.id,
      borrowerAlias: 'Jordan Smith',
      startDate: '2026-12-20',
      endDate: '2026-12-25',
    });

    render(<BorrowingPage adapter={adapter} />);

    // Switch to Owner View
    const ownerTab = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab);

    expect(await screen.findByText('Jordan Smith')).toBeInTheDocument();

    // Click Decline
    const declineBtn = screen.getByRole('button', { name: /^Decline$/i });
    fireEvent.click(declineBtn);

    // Confirm decline
    expect(screen.getByRole('heading', { name: /Decline Borrowing Request/i })).toBeInTheDocument();
    const modalDeclineBtn = screen.getByRole('button', { name: /Decline Request/i });
    fireEvent.click(modalDeclineBtn);

    await waitFor(async () => {
      const updated = await adapter.getBorrowRequestById('req-to-decline');
      expect(updated.status).toBe(REQUEST_STATUS.DECLINED);
    });
  });

  it('filters requests reactively by status pills', async () => {
    // Seed 1 pending and 1 approved request
    await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Borrower A',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
    });
    const req2 = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Borrower B',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
    });
    await adapter.approveBorrowRequest(req2.id);

    render(<BorrowingPage adapter={adapter} />);

    expect(await screen.findByText('Borrower A')).toBeInTheDocument();
    expect(screen.getByText('Borrower B')).toBeInTheDocument();

    // Filter to Approved
    const approvedPill = screen.getByRole('button', { name: /Approved \(1\)/i });
    fireEvent.click(approvedPill);

    expect(screen.queryByText('Borrower A')).not.toBeInTheDocument();
    expect(screen.getByText('Borrower B')).toBeInTheDocument();

    // Filter to Declined (0 records)
    const declinedPill = screen.getByRole('button', { name: /Declined \(0\)/i });
    fireEvent.click(declinedPill);

    expect(screen.getByText(/No Requests Matching Filter/i)).toBeInTheDocument();
  });

  it('displays uncollected banner when approved reservation deadline has passed without handover', async () => {
    // Seed an approved reservation with a past end date via mergeAllData
    await adapter.mergeAllData({
      items: [],
      requests: [
        {
          id: 'uncollected-req',
          itemId: testItem.id,
          borrowerAlias: 'Past Borrower',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          status: REQUEST_STATUS.APPROVED,
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
      ],
      loans: [
        {
          requestId: 'uncollected-req',
          itemId: testItem.id,
          status: 'RESERVED',
          collectionDate: '2026-11-01',
          returnDeadline: '2026-11-05',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
      ],
    });

    render(<BorrowingPage adapter={adapter} />);

    expect(await screen.findByText(/Collection not recorded — owner resolution required/i)).toBeInTheDocument();
  });

  it('displays overdue warning when an active loan return deadline has passed', async () => {
    await adapter.mergeAllData({
      items: [],
      requests: [
        {
          id: 'overdue-active-req',
          itemId: testItem.id,
          borrowerAlias: 'Active Borrower',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          status: REQUEST_STATUS.APPROVED,
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
      ],
      loans: [
        {
          requestId: 'overdue-active-req',
          itemId: testItem.id,
          status: 'ACTIVE',
          collectionDate: '2026-11-01',
          returnDeadline: '2026-11-05',
          collectedAt: '2026-11-01T11:00:00.000Z',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T11:00:00.000Z',
          handoverCheckpoint: {
            conditionGrade: 4,
            recordedByRole: 'OWNER',
            timestamp: '2026-11-01T11:00:00.000Z',
            notes: 'Handed over in good condition',
            photos: [],
          },
        },
      ],
    });

    render(<BorrowingPage adapter={adapter} />);

    expect(await screen.findByText(/Overdue Active Loan: Return deadline was/i)).toBeInTheDocument();
    expect(screen.getByText(/Item remains in physical custody until return inspection/i)).toBeInTheDocument();
  });

  it('allows owner to open Record Handover modal for a reserved loan', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const futureStr = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Handover Test Borrower',
      startDate: todayStr,
      endDate: futureStr,
    });
    await adapter.approveBorrowRequest(req.id);

    render(<BorrowingPage adapter={adapter} />);

    // Switch to Owner View
    const ownerTab = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab);

    const recordHandoverBtn = await screen.findByRole('button', { name: /Record Handover/i });
    fireEvent.click(recordHandoverBtn);

    expect(screen.getByText(/Physical Handover Recording/i)).toBeInTheDocument();
  });
});
