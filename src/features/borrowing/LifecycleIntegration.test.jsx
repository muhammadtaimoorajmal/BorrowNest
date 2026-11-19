import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { REQUEST_STATUS } from './constants/requestStatus';
import { LOAN_STATUS } from './constants/loanStatus';

describe('Cross-Module Integration: Complete Physical Loan Custody Lifecycle (DR-04)', () => {
  let adapter;

  beforeEach(async () => {
    window.location.hash = '#discover';
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_LifecycleIntegration_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('coordinates end-to-end physical loan lifecycle from listing to return inspection and safeguards', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const returnStr = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

    // 1. Owner lists an item with baseline condition
    const item = await adapter.createItem({
      id: 'lifecycle-drill-1',
      title: 'Hammer Drill 18V Kit',
      description: 'Heavy duty hammer drill with 2 masonry bits and carry case.',
      category: 'TOOLS',
      conditionGrade: 4,
      conditionNotes: 'Baseline: minor scuffs on chuck, motor runs smooth.',
      approximateArea: 'West End / Riverdale',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<App adapter={adapter} />);

    // 2. Discover page displays item
    expect(await screen.findByText('Hammer Drill 18V Kit')).toBeInTheDocument();

    // 3. Borrower inspects details and submits request
    const viewBtn = screen.getByRole('button', { name: /View details for Hammer Drill 18V Kit/i });
    fireEvent.click(viewBtn);

    const requestBtn = await screen.findByRole('button', { name: /Request to Borrow/i });
    fireEvent.click(requestBtn);

    expect(await screen.findByRole('dialog', { name: /Request to Borrow/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Sammy Carpenter' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: todayStr },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: returnStr },
    });
    fireEvent.change(screen.getByLabelText(/Note to Owner/i), {
      target: { value: 'Mounting shelving brackets in brick' },
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Borrowing Request Submitted!/i)).toBeInTheDocument();

    // Navigate to Borrowing workspace
    const viewWorkspaceBtn = screen.getByRole('button', { name: /View in Borrowing Workspace/i });
    fireEvent.click(viewWorkspaceBtn);

    expect(await screen.findByRole('heading', { name: /Borrowing Requests & Reservations Workspace/i })).toBeInTheDocument();
    expect(await screen.findByText('Sammy Carpenter')).toBeInTheDocument();

    // 4. Owner approves request in Lending workspace
    window.location.hash = '#lending';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const reqTab = await screen.findByRole('tab', { name: /Incoming Requests 1/i });
    fireEvent.click(reqTab);

    expect(await screen.findByText('Sammy Carpenter')).toBeInTheDocument();
    const approveBtn = screen.getByRole('button', { name: /Approve Request/i });
    fireEvent.click(approveBtn);

    const modalApproveBtn = screen.getAllByRole('button', { name: /Approve Request/i })[1];
    fireEvent.click(modalApproveBtn);

    // Verify storage has approved request and created RESERVED loan
    let loanRecord;
    await waitFor(async () => {
      const allReqs = await adapter.listBorrowRequests({ itemId: item.id });
      expect(allReqs[0].status).toBe(REQUEST_STATUS.APPROVED);
      loanRecord = await adapter.getLoanByRequestId(allReqs[0].id);
      expect(loanRecord).toBeDefined();
      expect(loanRecord.status).toBe(LOAN_STATUS.RESERVED);
    });

    // 5. Physical Collection Handover: Owner records handover
    window.location.hash = '#borrowing';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const ownerTab = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab);

    const recordHandoverBtn = await screen.findByRole('button', { name: /Record Handover/i });
    fireEvent.click(recordHandoverBtn);

    // Handover modal opens
    expect(await screen.findByText(/Physical Handover Recording/i)).toBeInTheDocument();
    const notesInput = screen.getByLabelText(/Handover Observations & Physical State Notes/i);
    fireEvent.change(notesInput, {
      target: { value: 'Handed over in person with 2 masonry bits and carry case.' },
    });

    const submitHandoverBtn = screen.getByRole('button', { name: /Record Collection Handover/i });
    fireEvent.click(submitHandoverBtn);

    // Awaiting borrower confirmation
    await waitFor(async () => {
      const updatedLoan = await adapter.getLoanByRequestId(loanRecord.requestId);
      expect(updatedLoan.collectionCheckpoint?.ownerRecordedAt).toBeDefined();
      expect(updatedLoan.status).toBe(LOAN_STATUS.RESERVED);
    });

    // 6. Borrower confirms physical receipt
    const borrowerTab = await screen.findByRole('tab', { name: /Borrower View/i });
    fireEvent.click(borrowerTab);

    const confirmReceiptBtn = await screen.findByRole('button', { name: /Confirm Physical Receipt/i });
    fireEvent.click(confirmReceiptBtn);

    // Modal submit button is now present
    const modalReceiptBtns = await screen.findAllByRole('button', { name: /Confirm Physical Receipt/i });
    fireEvent.click(modalReceiptBtns[modalReceiptBtns.length - 1]);

    // Loan transitions to ACTIVE
    await waitFor(async () => {
      const updatedLoan = await adapter.getLoanByRequestId(loanRecord.requestId);
      expect(updatedLoan.status).toBe(LOAN_STATUS.ACTIVE);
      expect(updatedLoan.collectedAt).toBeDefined();
    });

    // 7. Relational Safeguard: Archiving blocked while ACTIVE loan exists
    window.location.hash = '#lending';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const activeListingsTab = await screen.findByRole('tab', { name: /Active Listings 1/i });
    fireEvent.click(activeListingsTab);

    const archiveBtn = await screen.findByRole('button', { name: /Archive Hammer Drill 18V Kit/i });
    fireEvent.click(archiveBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(/active or approved reservation/i);

    // 8. Return Handover: Borrower marks returned
    window.location.hash = '#borrowing';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const markReturnBtn = await screen.findByRole('button', { name: /Mark Item Returned/i });
    fireEvent.click(markReturnBtn);

    const confirmReturnBtn = await screen.findByRole('button', { name: /Mark Item as Physically Returned/i });
    fireEvent.click(confirmReturnBtn);

    await waitFor(async () => {
      const updatedLoan = await adapter.getLoanByRequestId(loanRecord.requestId);
      expect(updatedLoan.returnCheckpoint?.borrowerReturnMarkedAt).toBeDefined();
    });

    // 9. Return Inspection: Owner inspects condition and completes loan
    const ownerTab2 = await screen.findByRole('tab', { name: /Owner View/i });
    fireEvent.click(ownerTab2);

    const inspectBtn = await screen.findByRole('button', { name: /Inspect Return & Complete/i });
    fireEvent.click(inspectBtn);

    expect(await screen.findByText(/Return Condition Inspection/i)).toBeInTheDocument();
    const inspectNotes = screen.getByLabelText(/Return Inspection Observations & Physical Condition Notes/i);
    fireEvent.change(inspectNotes, {
      target: { value: 'Returned in clean state, both bits returned, motor sounds great.' },
    });

    const submitInspectionBtn = screen.getByRole('button', { name: /Complete Return Inspection/i });
    fireEvent.click(submitInspectionBtn);

    // Loan transitions to COMPLETED
    await waitFor(async () => {
      const updatedLoan = await adapter.getLoanByRequestId(loanRecord.requestId);
      expect(updatedLoan.status).toBe(LOAN_STATUS.COMPLETED);
      expect(updatedLoan.completedAt).toBeDefined();
    });

    // 10. Condition Comparison Modal opens from button
    const viewComparisonBtn = await screen.findByRole('button', { name: /View Condition Comparison/i });
    fireEvent.click(viewComparisonBtn);

    expect(await screen.findByText(/DR-04 Structured Condition Checkpoints/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Listing Baseline$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Collection Handover$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Return Inspection$/i })).toBeInTheDocument();
    expect(screen.getByText(/Condition rating unchanged/i)).toBeInTheDocument();
    expect(screen.getByText(/informational observations for transparency/i)).toBeInTheDocument();

    const closeComparisonBtns = screen.getAllByRole('button', { name: /Close comparison view/i });
    fireEvent.click(closeComparisonBtns[0]);

    // 11. Relational Safeguard: Now that loan is COMPLETED, archiving is permitted!
    window.location.hash = '#lending';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const archiveBtn2 = await screen.findByRole('button', { name: /Archive Hammer Drill 18V Kit/i });
    fireEvent.click(archiveBtn2);

    await waitFor(async () => {
      const updatedItem = await adapter.getItemById(item.id);
      expect(updatedItem.status).toBe('ARCHIVED');
    });

    // 12. Permanent Deletion remains blocked because loan/request history exists!
    const archivedTab = await screen.findByRole('tab', { name: /Archived 1/i });
    fireEvent.click(archivedTab);

    const deleteBtn = await screen.findByRole('button', { name: /Delete Hammer Drill 18V Kit/i });
    fireEvent.click(deleteBtn);

    // Defect 05: Proactively informs owner that historical records prevent permanent deletion
    expect(await screen.findByRole('heading', { name: /Listing Has Historical Records/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Permanently Delete$/i })).not.toBeInTheDocument();

    const stillExists = await adapter.getItemById(item.id);
    expect(stillExists).toBeDefined();
  });
});
