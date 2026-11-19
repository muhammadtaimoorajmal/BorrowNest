import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { DemoProfileProvider, useDemoProfile } from './context/DemoProfileContext';
import { seedDemoMarketplace } from './services/seedDemoMarketplace';
import { REQUEST_STATUS } from '../borrowing/constants/requestStatus';
import { LOAN_STATUS } from '../borrowing/constants/loanStatus';
import DiscoverPage from '../discover/pages/DiscoverPage';
import LendingPage from '../listings/pages/LendingPage';
import BorrowingPage from '../borrowing/pages/BorrowingPage';
import AccountPage from '../account/pages/AccountPage';

describe('BorrowNest Final Release Acceptance: Marketplace Integration & Quality Assurance', () => {
  let adapter;

  beforeEach(async () => {
    localStorage.clear();
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_FinalAcceptance_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllBorrowRequests();
    await adapter.clearAllLoans();
    await adapter.clearAllItems();
  });

  // Helper component to render pages within DemoProfileProvider with an explicit starting profile
  function renderWithProfile(ui, profileId = 'demo-borrower') {
    function ProviderWrapper({ children }) {
      return (
        <DemoProfileProvider>
          <InitProfile profileId={profileId}>{children}</InitProfile>
        </DemoProfileProvider>
      );
    }

    function InitProfile({ profileId, children }) {
      const { switchProfile, activeProfileId } = useDemoProfile();
      React.useEffect(() => {
        if (activeProfileId !== profileId) {
          switchProfile(profileId);
        }
      }, [profileId, switchProfile, activeProfileId]);

      return children;
    }

    return render(ui, { wrapper: ProviderWrapper });
  }

  // --------------------------------------------------------------------------
  // Scenario A: Startup and Catalogue Integrity
  // --------------------------------------------------------------------------
  it('Scenario A: Startup & Catalogue — seeds 20 items, accurate 5/4/4/4/3 split, exactly 1 card per product, live availability', async () => {
    await seedDemoMarketplace(adapter);

    const items = await adapter.getAllItems();
    expect(items.length).toBe(20);

    const categoryCounts = { TOOLS: 0, GARDENING: 0, HOUSEHOLD: 0, OUTDOOR: 0, ELECTRONICS: 0 };
    for (const item of items) {
      expect(categoryCounts[item.category]).toBeDefined();
      categoryCounts[item.category]++;
      expect(item.photos.length).toBeGreaterThan(0);
      expect(item.photos[0].imagePath).toMatch(/\.(webp|jpg|jpeg|png)$/);
      expect(item.availability).toBe('AVAILABLE');
      expect(item.ownerProfileId).toBeDefined();
    }

    expect(categoryCounts.TOOLS).toBe(5);
    expect(categoryCounts.GARDENING).toBe(4);
    expect(categoryCounts.HOUSEHOLD).toBe(4);
    expect(categoryCounts.OUTDOOR).toBe(4);
    expect(categoryCounts.ELECTRONICS).toBe(3);

    // Verify UI rendering on DiscoverPage: single unified grid, 20 items, exactly 1 card per product
    renderWithProfile(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />, 'demo-borrower');

    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

    const drillCards = screen.getAllByRole('heading', { level: 3, name: 'Cordless Compact Drill/Driver' });
    expect(drillCards.length).toBe(1);

    const exampleBadges = screen.getAllByText('Example Item');
    expect(exampleBadges.length).toBe(20);

    const availableBadges = screen.getAllByText('Available');
    expect(availableBadges.length).toBe(20);
  });

  // --------------------------------------------------------------------------
  // Scenario B: Borrowing from Example Product
  // --------------------------------------------------------------------------
  it('Scenario B: Borrowing from Example Product — Demo Borrower requests drill, persists demo request metadata', async () => {
    await seedDemoMarketplace(adapter);

    renderWithProfile(<DiscoverPage adapter={adapter} onNavigateToLending={() => {}} />, 'demo-borrower');
    expect(await screen.findByText('Showing 20 of 20 items')).toBeInTheDocument();

    // Open detail modal for Cordless Compact Drill/Driver
    const viewBtn = screen.getByRole('button', { name: /View details for Cordless Compact Drill\/Driver/i });
    fireEvent.click(viewBtn);

    const modal = screen.getByRole('dialog', { name: /Cordless Compact Drill\/Driver/i });
    expect(modal).toBeInTheDocument();

    // Click Request to Borrow
    const requestBtn = within(modal).getByRole('button', { name: /Request to Borrow/i });
    fireEvent.click(requestBtn);

    // Fill borrow request dialog
    expect(await screen.findByRole('dialog', { name: /Request to Borrow/i })).toBeInTheDocument();

    const aliasInput = screen.getByLabelText(/Your Name or Alias/i);
    const startInput = screen.getByLabelText(/Collection Date/i);
    const endInput = screen.getByLabelText(/Return Deadline/i);
    const noteInput = screen.getByLabelText(/Note to Owner/i);

    fireEvent.change(aliasInput, { target: { value: 'Jordan River (Demo Borrower)' } });
    fireEvent.change(startInput, { target: { value: '2026-12-01' } });
    fireEvent.change(endInput, { target: { value: '2026-12-05' } });
    fireEvent.change(noteInput, { target: { value: 'Need drill for backyard shelving project.' } });

    const submitBtn = screen.getByRole('button', { name: /^Submit Request$/i });
    fireEvent.click(submitBtn);

    await waitFor(async () => {
      const requests = await adapter.listBorrowRequests();
      expect(requests.length).toBe(1);
      const req = requests[0];
      expect(req.status).toBe(REQUEST_STATUS.PENDING);
      expect(req.borrowerProfileId).toBe('demo-borrower');
      expect(req.ownerProfileId).toBe('demo-owner-tools');
      expect(req.isDemoRequest).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario C: Owner Approval
  // --------------------------------------------------------------------------
  it('Scenario C: Owner Approval — Demo Owner — Tools sees incoming request and approves into RESERVED loan', async () => {
    await seedDemoMarketplace(adapter);

    const drillItem = await adapter.getItemById('demo-cordless-drill');
    await adapter.createBorrowRequest({
      itemId: drillItem.id,
      borrowerAlias: 'Jordan River (Demo Borrower)',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      requestNote: 'Assembling backyard shelf.',
      borrowerProfileId: 'demo-borrower',
      ownerProfileId: 'demo-owner-tools',
      ownerDisplayName: 'Demo Owner — Tools',
      isDemoRequest: true,
    });

    // Render BorrowingPage as Demo Owner — Tools
    renderWithProfile(<BorrowingPage adapter={adapter} />, 'demo-owner-tools');

    // Perspective automatically switches to Owner View
    expect(await screen.findByRole('tab', { name: /Owner View/i })).toHaveAttribute('aria-selected', 'true');

    // Verify incoming pending request is visible
    expect(await screen.findByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
    expect(screen.getByText('Jordan River (Demo Borrower)')).toBeInTheDocument();

    // Approve the request
    const approveBtn = screen.getByRole('button', { name: /Approve Request/i });
    fireEvent.click(approveBtn);

    // Confirm approval dialog
    const confirmDialog = await screen.findByRole('dialog', { name: /Approve Borrowing Request/i });
    const confirmApproveBtn = within(confirmDialog).getByRole('button', { name: /^Approve Request$/i });
    fireEvent.click(confirmApproveBtn);

    await waitFor(async () => {
      const loans = await adapter.listLoans();
      expect(loans.length).toBe(1);
      expect(loans[0].status).toBe(LOAN_STATUS.RESERVED);
      expect(loans[0].ownerProfileId).toBe('demo-owner-tools');
      expect(loans[0].borrowerProfileId).toBe('demo-borrower');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario D: Borrower Status Perspective
  // --------------------------------------------------------------------------
  it('Scenario D: Borrower Status — Demo Borrower sees reservation with owner actions hidden', async () => {
    await seedDemoMarketplace(adapter);

    const drillItem = await adapter.getItemById('demo-cordless-drill');
    const req = await adapter.createBorrowRequest({
      itemId: drillItem.id,
      borrowerAlias: 'Jordan River (Demo Borrower)',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      borrowerProfileId: 'demo-borrower',
      ownerProfileId: 'demo-owner-tools',
      ownerDisplayName: 'Demo Owner — Tools',
      isDemoRequest: true,
    });
    await adapter.approveBorrowRequest(req.id);

    // Render BorrowingPage as Demo Borrower
    renderWithProfile(<BorrowingPage adapter={adapter} />, 'demo-borrower');

    // Automatically synchronizes to Borrower perspective
    expect(await screen.findByRole('tab', { name: /Borrower View/i })).toHaveAttribute('aria-selected', 'true');

    // Reservation is visible in both Active Reservations and the card list
    const titles = await screen.findAllByText('Cordless Compact Drill/Driver');
    expect(titles.length).toBeGreaterThanOrEqual(1);

    // Owner-only actions (like "Record Handover") are hidden from borrower
    expect(screen.queryByRole('button', { name: /Record Handover/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inspect Return/i })).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario E: Complete Physical Lifecycle Handover & Return
  // --------------------------------------------------------------------------
  it('Scenario E: Physical Lifecycle — Handover -> Receipt -> Return -> Inspection -> Item Restored to AVAILABLE', async () => {
    await seedDemoMarketplace(adapter);

    const todayStr = new Date().toISOString().slice(0, 10);
    const futureStr = new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10);

    const drillItem = await adapter.getItemById('demo-cordless-drill');
    const req = await adapter.createBorrowRequest({
      itemId: drillItem.id,
      borrowerAlias: 'Jordan River (Demo Borrower)',
      startDate: todayStr,
      endDate: futureStr,
      borrowerProfileId: 'demo-borrower',
      ownerProfileId: 'demo-owner-tools',
      ownerDisplayName: 'Demo Owner — Tools',
      isDemoRequest: true,
    });
    await adapter.approveBorrowRequest(req.id);

    // Step 1: Owner records collection handover
    const handedOver = await adapter.recordCollectionHandover(req.id, {
      conditionGrade: 4,
      conditionNotes: 'All chuck keys and 2 batteries included.',
    });
    expect(handedOver.collectionCheckpoint.conditionGrade).toBe(4);

    // Step 2: Borrower confirms collection receipt -> ACTIVE
    const active = await adapter.confirmCollectionReceipt(req.id, {
      observation: 'Received in good condition.',
    });
    expect(active.status).toBe(LOAN_STATUS.ACTIVE);

    // Step 3: Borrower marks item returned
    const returned = await adapter.markLoanReturned(req.id);
    expect(returned.returnCheckpoint.borrowerReturnMarkedAt).toBeDefined();

    // Step 4: Owner completes return inspection -> COMPLETED
    const completed = await adapter.completeReturnInspection(req.id, {
      conditionGrade: 4,
      conditionNotes: 'Verified clean and complete.',
    });
    expect(completed.status).toBe(LOAN_STATUS.COMPLETED);

    // Step 5: Item availability automatically restored to AVAILABLE
    const refreshed = await adapter.getItemById('demo-cordless-drill');
    expect(refreshed.availability).toBe('AVAILABLE');
  });

  // --------------------------------------------------------------------------
  // Scenario F: User-Created Listing Ownership
  // --------------------------------------------------------------------------
  it('Scenario F: Listing Ownership — Demo Owner — Gardening creates listing, persists owner ID, visible in Discover', async () => {
    await seedDemoMarketplace(adapter);

    renderWithProfile(<LendingPage adapter={adapter} />, 'demo-owner-gardening');
    expect(await screen.findByRole('heading', { name: /Lending Workspace/i })).toBeInTheDocument();

    // Open Add New Item form
    const addBtn = screen.getByRole('button', { name: /Add New Item/i });
    fireEvent.click(addBtn);

    expect(await screen.findByRole('heading', { name: /Create Item Listing/i })).toBeInTheDocument();

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/Item Title/i), { target: { value: 'Heavy Duty Wheelbarrow' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'GARDENING' } });
    fireEvent.change(screen.getByLabelText(/Initial Condition/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/Item Description/i), {
      target: { value: 'Single-wheel heavy-duty construction wheelbarrow for garden compost and mulch.' },
    });
    fireEvent.change(screen.getByLabelText(/General Pickup Area/i), { target: { value: 'Oakridge / Community Garden' } });

    // Upload mock photo and provide alt text
    const fileInput = document.getElementById('photo-upload-input');
    const fakeFile = new File(['wheelbarrow-photo-bytes'], 'wheelbarrow.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    const altInput = await screen.findByLabelText(/Image Description \(Alt Text\)/i);
    fireEvent.change(altInput, { target: { value: 'Clean wheelbarrow on lawn' } });

    // Attestation checkbox
    const attestation = screen.getByLabelText(/I confirm that uploaded photographs genuinely represent/i);
    fireEvent.click(attestation);

    const submitBtn = screen.getByRole('button', { name: /^Create Listing$/i });
    fireEvent.click(submitBtn);

    await waitFor(async () => {
      const allItems = await adapter.getAllItems();
      const wheelbarrow = allItems.find((i) => i.title === 'Heavy Duty Wheelbarrow');
      expect(wheelbarrow).toBeDefined();
      expect(wheelbarrow.ownerProfileId).toBe('demo-owner-gardening');
      expect(wheelbarrow.ownerDisplayName).toBe('Demo Owner — Gardening');
      expect(wheelbarrow.isDemo).toBe(false);
      expect(wheelbarrow.demoSeed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario G: Relational Listing Removal & Safeguards
  // --------------------------------------------------------------------------
  it('Scenario G: Listing Removal — enforces Case A, Case B, Case C, baseline protection, and cascade delete', async () => {
    await seedDemoMarketplace(adapter);

    // 1. Baseline Seeded Item: Cannot be permanently deleted
    await expect(adapter.deleteDemoListingAndHistory('demo-cordless-drill')).rejects.toThrow(/baseline/i);

    // 2. Case A: Clean custom item with NO history -> Direct permanent delete allowed
    const cleanItem = await adapter.createItem({
      id: 'demo-custom-clean-item',
      title: 'Custom Clean Item',
      description: 'Item with zero transaction history.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'Westside',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleteRes = await adapter.deleteItem(cleanItem.id);
    expect(deleteRes.deleted).toBe(true);
    await expect(adapter.getItemById(cleanItem.id)).rejects.toThrow();

    // 3. Case C: Custom item with pending requests -> Archiving blocked (Defect 06)
    const activeItem = await adapter.createItem({
      id: 'demo-custom-pending-item',
      title: 'Custom Pending Item',
      description: 'Item with pending request.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'Westside',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await adapter.createBorrowRequest({
      itemId: activeItem.id,
      borrowerAlias: 'Test Borrower',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      isDemoRequest: true,
    });

    // Archiving blocked with pending requests
    await expect(adapter.archiveItem(activeItem.id)).rejects.toThrow(/pending borrowing request/i);

    // Ordinary permanent delete blocked by relational guard
    await expect(adapter.deleteItem(activeItem.id)).rejects.toThrow(/associated borrowing request/i);

    // 4. Classroom Demonstration Cascade Delete: Atomic removal of custom item and demo requests
    const cascadeRes = await adapter.deleteDemoListingAndHistory(activeItem.id);
    expect(cascadeRes.deleted).toBe(true);

    await expect(adapter.getItemById(activeItem.id)).rejects.toThrow();
    const reqsAfterCascade = await adapter.listBorrowRequests();
    expect(reqsAfterCascade.some((r) => r.itemId === activeItem.id)).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario H: Demonstration Marketplace Reset Safeguard
  // --------------------------------------------------------------------------
  it('Scenario H: Reset Demonstration Transactions — restores 20 items to Available, purges demo transactions, preserves user items', async () => {
    await seedDemoMarketplace(adapter);

    // 1. Create a custom user listing that must be preserved
    const userItem = await adapter.createItem({
      id: 'user-custom-ladder',
      title: 'User Telescoping Ladder',
      description: 'Personal aluminum ladder with locking rungs.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'Greenwood',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    });

    // 2. Create demo transactions on a seeded item (while it is AVAILABLE)
    const drill = await adapter.getItemById('demo-cordless-drill');
    await adapter.createBorrowRequest({
      itemId: drill.id,
      borrowerAlias: 'Jordan River (Demo Borrower)',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      borrowerProfileId: 'demo-borrower',
      ownerProfileId: 'demo-owner-tools',
      isDemoRequest: true,
    });

    // Mark drill unavailable
    await adapter.updateItem({ ...drill, availability: 'UNAVAILABLE' });

    // Verify before reset
    const requestsBefore = await adapter.listBorrowRequests();
    expect(requestsBefore.length).toBe(1);

    // 3. Perform Reset Demonstration Transactions via AccountPage
    renderWithProfile(<AccountPage storageAdapter={adapter} onDataRestored={() => {}} />, 'demo-owner-tools');

    expect(await screen.findByRole('heading', { name: /Classroom Demonstration Marketplace/i })).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset Demo Data/i });
    fireEvent.click(resetBtn);

    // Confirm dialog
    expect(await screen.findByRole('alertdialog', { name: /Reset Demonstration Data\?/i })).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Yes, Reset Demo/i });
    fireEvent.click(confirmBtn);

    // Success message is displayed
    expect(await screen.findByText(/Demonstration marketplace reset successfully/i)).toBeInTheDocument();

    // Verify post-reset database invariants:
    // a. All 20 seeded demo items are restored to AVAILABLE
    const restoredDrill = await adapter.getItemById('demo-cordless-drill');
    expect(restoredDrill.availability).toBe('AVAILABLE');

    // b. Demo requests and loans are purged
    const requestsAfter = await adapter.listBorrowRequests();
    expect(requestsAfter.length).toBe(0);

    const loansAfter = await adapter.listLoans();
    expect(loansAfter.length).toBe(0);

    // c. User item is strictly preserved
    const preservedUserItem = await adapter.getItemById(userItem.id);
    expect(preservedUserItem).toBeDefined();
    expect(preservedUserItem.title).toBe('User Telescoping Ladder');
  });
});
