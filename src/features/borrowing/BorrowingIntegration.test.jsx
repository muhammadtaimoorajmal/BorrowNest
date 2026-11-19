import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { REQUEST_STATUS } from './constants/requestStatus';

describe('Cross-Module Integration: Discover -> Borrow Request -> Lending Approval Lifecycle', () => {
  let adapter;

  beforeEach(async () => {
    window.location.hash = '#discover';
    adapter = new IndexedDbStorageAdapter(null, `BorrowNest_Integration_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  it('coordinates full lifecycle from discovery to reservation with overlap prevention and relational safeguards', async () => {
    // 1. Owner has listed an item
    const item = await adapter.createItem({
      id: 'integration-tool-1',
      title: 'Dewalt Cordless Circular Saw',
      description: '7-1/4 inch brushless saw with 5.0Ah battery and charger included.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'Highland Park / 4th Ward',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<App adapter={adapter} />);

    // 2. Discover page displays the item
    expect(await screen.findByText('Dewalt Cordless Circular Saw')).toBeInTheDocument();

    // 3. Borrower clicks to view item details
    const viewBtn = screen.getByRole('button', { name: /View details for Dewalt Cordless Circular Saw/i });
    fireEvent.click(viewBtn);

    // 4. Modal opens; borrower clicks "Request to Borrow"
    const requestBtn = await screen.findByRole('button', { name: /Request to Borrow/i });
    fireEvent.click(requestBtn);

    // 5. BorrowRequestDialog opens
    expect(await screen.findByRole('dialog', { name: /Request to Borrow/i })).toBeInTheDocument();
    expect(await screen.findByText(/No existing reservations/i)).toBeInTheDocument();

    // 6. Borrower enters request details
    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Morgan Taylor' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: '2026-12-05' },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: '2026-12-10' },
    });
    fireEvent.change(screen.getByLabelText(/Note to Owner/i), {
      target: { value: 'Building a bookshelf over the weekend' },
    });

    // 7. Submit request
    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    // 8. Success confirmation displays
    expect(await screen.findByText(/Borrowing Request Submitted!/i)).toBeInTheDocument();
    expect(screen.getByText('Morgan Taylor')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();

    // 9. Navigate to Borrowing workspace
    const viewWorkspaceBtn = screen.getByRole('button', { name: /View in Borrowing Workspace/i });
    fireEvent.click(viewWorkspaceBtn);

    // 10. Borrowing workspace shows pending request
    expect(await screen.findByRole('heading', { name: /Borrowing Requests & Reservations Workspace/i })).toBeInTheDocument();
    expect(await screen.findByText('Morgan Taylor')).toBeInTheDocument();
    expect(screen.getByText(/Building a bookshelf/i)).toBeInTheDocument();

    // 11. Navigate to Lending workspace (owner perspective)
    window.location.hash = '#lending';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    // 12. Lending page shows Incoming Requests with badge 1
    const reqTab = await screen.findByRole('tab', { name: /Incoming Requests 1/i });
    expect(reqTab).toBeInTheDocument();
    fireEvent.click(reqTab);

    // 13. Owner approves request
    expect(await screen.findByText('Morgan Taylor')).toBeInTheDocument();
    const approveBtn = screen.getByRole('button', { name: /Approve Request/i });
    fireEvent.click(approveBtn);

    expect(screen.getByRole('heading', { name: /Approve Borrowing Request/i })).toBeInTheDocument();
    const modalApproveBtn = screen.getAllByRole('button', { name: /Approve Request/i })[1];
    fireEvent.click(modalApproveBtn);

    // 14. Verification: Request in storage is APPROVED
    await waitFor(async () => {
      const allRequests = await adapter.listBorrowRequests({ itemId: item.id });
      expect(allRequests.length).toBe(1);
      expect(allRequests[0].status).toBe(REQUEST_STATUS.APPROVED);
    });

    // 15. A second borrower tries to request overlapping dates in Discover
    window.location.hash = '#discover';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const viewBtn2 = await screen.findByRole('button', { name: /View details for Dewalt Cordless Circular Saw/i });
    fireEvent.click(viewBtn2);

    const requestBtn2 = await screen.findByRole('button', { name: /Request to Borrow/i });
    fireEvent.click(requestBtn2);

    // Dialog must display the existing approved booking: Dec 5 – Dec 10
    expect(await screen.findByText(/🔒 Booked:/i)).toBeInTheDocument();

    // Enter conflicting overlapping dates: Dec 8 – Dec 12
    fireEvent.change(screen.getByLabelText(/Your Name or Alias/i), {
      target: { value: 'Second Borrower' },
    });
    fireEvent.change(screen.getByLabelText(/Collection Date/i), {
      target: { value: '2026-12-08' },
    });
    fireEvent.change(screen.getByLabelText(/Return Deadline/i), {
      target: { value: '2026-12-12' },
    });

    const submitConflictBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitConflictBtn);

    // Overlap conflict must be prevented!
    expect(await screen.findByText(/overlap with an existing reservation/i)).toBeInTheDocument();

    // Close second request dialog
    const closeDialogBtn = screen.getByRole('button', { name: /Close dialog/i });
    fireEvent.click(closeDialogBtn);

    // 16. Safeguards: Owner cannot delete item while request history exists
    window.location.hash = '#lending';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    const deleteBtn = await screen.findByRole('button', { name: /Delete Dewalt Cordless Circular Saw/i });
    fireEvent.click(deleteBtn);

    // Defect 05: Proactively informs owner that active borrowing activity blocks deletion
    expect(await screen.findByRole('heading', { name: /Active Borrowing Activity in Progress/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Permanently Delete$/i })).not.toBeInTheDocument();

    const cancelDeleteBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelDeleteBtn);

    // 17. Safeguards: Owner cannot archive item while approved reservation is active
    const archiveBtn = screen.getByRole('button', { name: /Archive Dewalt Cordless Circular Saw/i });
    fireEvent.click(archiveBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(/active or approved reservation/i);
  });
});
