import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { DemoProfileProvider, useDemoProfile } from './context/DemoProfileContext';
import { seedDemoMarketplace, SEEDED_CATALOGUE_COUNT } from './services/seedDemoMarketplace';
import { resetDemoMarketplace } from './services/resetDemoMarketplace';
import { DEMO_PROFILES, getDemoProfileById, getDemoOwnerForCategory } from './data/demoProfiles';
import { REQUEST_STATUS } from '../borrowing/constants/requestStatus';
import { LOAN_STATUS } from '../borrowing/constants/loanStatus';
import App from '../../App';
import BorrowingPage from '../borrowing/pages/BorrowingPage';
import LendingPage from '../listings/pages/LendingPage';

describe('Classroom Demonstration Marketplace Integration', () => {
  let adapter;

  beforeEach(async () => {
    localStorage.clear();
    adapter = new IndexedDbStorageAdapter(
      null,
      `BorrowNest_DemoMarketplace_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  describe('1. Catalogue Seeding & Profile Assignment Integrity', () => {
    it('seeds exactly 20 products with authentic 5/4/4/4/3 category distribution and demo owner assignments', async () => {
      const result = await seedDemoMarketplace(adapter);
      expect(result.seededCount).toBe(SEEDED_CATALOGUE_COUNT);
      expect(result.totalDemoCount).toBe(20);

      const items = await adapter.listItems();
      expect(items.length).toBe(20);

      const categoryCounts = { TOOLS: 0, GARDENING: 0, HOUSEHOLD: 0, OUTDOOR: 0, ELECTRONICS: 0 };
      const ownerCounts = {};

      for (const item of items) {
        expect(categoryCounts[item.category]).toBeDefined();
        categoryCounts[item.category]++;

        expect(item.ownerProfileId).toBeDefined();
        expect(item.ownerDisplayName).toBeDefined();
        expect(item.isDemo).toBe(true);
        expect(item.availability).toBe('AVAILABLE');
        expect(item.status).toBe('ACTIVE');
        expect(item.photos.length).toBeGreaterThan(0);
        expect(item.photos[0].imagePath).toMatch(/\.(webp|jpg|jpeg|png)$/);

        ownerCounts[item.ownerProfileId] = (ownerCounts[item.ownerProfileId] || 0) + 1;
      }

      // Verify exact category distribution
      expect(categoryCounts.TOOLS).toBe(5);
      expect(categoryCounts.GARDENING).toBe(4);
      expect(categoryCounts.HOUSEHOLD).toBe(4);
      expect(categoryCounts.OUTDOOR).toBe(4);
      expect(categoryCounts.ELECTRONICS).toBe(3);

      // Verify owner distribution matches category ownership
      expect(ownerCounts['demo-owner-tools']).toBe(5);
      expect(ownerCounts['demo-owner-gardening']).toBe(4);
      expect(ownerCounts['demo-owner-household']).toBe(4);
      expect(ownerCounts['demo-owner-outdoor-electronics']).toBe(7); // 4 Outdoor + 3 Electronics
    });

    it('is idempotent: subsequent seeding passes do not duplicate records', async () => {
      const firstPass = await seedDemoMarketplace(adapter);
      expect(firstPass.seededCount).toBe(20);

      const secondPass = await seedDemoMarketplace(adapter);
      expect(secondPass.seededCount).toBe(0);
      expect(secondPass.existingCount).toBe(20);

      const totalItems = await adapter.countItems();
      expect(totalItems).toBe(20);
    });
  });

  describe('2. Demonstration Profiles & Context Switching', () => {
    it('provides 5 structured demonstration identities with proper roles', () => {
      expect(DEMO_PROFILES.length).toBe(5);

      const borrower = getDemoProfileById('demo-borrower');
      expect(borrower.role).toBe('borrower');
      expect(borrower.badge).toBe('Borrower');

      const toolsOwner = getDemoProfileById('demo-owner-tools');
      expect(toolsOwner.role).toBe('lender');
      expect(toolsOwner.badge).toBe('Tools Lender');

      const gardeningOwner = getDemoProfileById('demo-owner-gardening');
      expect(gardeningOwner.role).toBe('lender');

      const householdOwner = getDemoProfileById('demo-owner-household');
      expect(householdOwner.role).toBe('lender');

      const techOwner = getDemoProfileById('demo-owner-outdoor-electronics');
      expect(techOwner.role).toBe('lender');
    });

    it('maps equipment categories to correct demonstration owners', () => {
      expect(getDemoOwnerForCategory('TOOLS').id).toBe('demo-owner-tools');
      expect(getDemoOwnerForCategory('GARDENING').id).toBe('demo-owner-gardening');
      expect(getDemoOwnerForCategory('HOUSEHOLD').id).toBe('demo-owner-household');
      expect(getDemoOwnerForCategory('OUTDOOR').id).toBe('demo-owner-outdoor-electronics');
      expect(getDemoOwnerForCategory('ELECTRONICS').id).toBe('demo-owner-outdoor-electronics');
    });
  });

  describe('3. End-to-End Interactive Borrowing Lifecycle Simulation', () => {
    it('executes complete 8-step lifecycle across Demo Borrower and Demo Owner — Tools', async () => {
      await seedDemoMarketplace(adapter);

      // STEP 1: Demo Borrower requests Cordless Hammer Drill
      const drillItem = await adapter.getItemById('demo-cordless-drill');
      expect(drillItem).toBeDefined();
      expect(drillItem.ownerProfileId).toBe('demo-owner-tools');

      const requestPayload = {
        itemId: drillItem.id,
        borrowerAlias: 'Jordan River (Demo Borrower)',
        startDate: '2026-11-19',
        endDate: '2026-11-25',
        requestNote: 'Assembling backyard wooden shelving unit for HCI demonstration.',
        borrowerProfileId: 'demo-borrower',
        ownerProfileId: 'demo-owner-tools',
        ownerDisplayName: 'Demo Owner — Tools',
        isDemoRequest: true,
      };

      const borrowRequest = await adapter.createBorrowRequest(requestPayload);
      expect(borrowRequest.id).toBeDefined();
      expect(borrowRequest.status).toBe(REQUEST_STATUS.PENDING);
      expect(borrowRequest.borrowerProfileId).toBe('demo-borrower');
      expect(borrowRequest.ownerProfileId).toBe('demo-owner-tools');

      // STEP 2: Demo Owner — Tools approves request in Borrowing workspace
      const approvedRequest = await adapter.approveBorrowRequest(borrowRequest.id);
      expect(approvedRequest.status).toBe(REQUEST_STATUS.APPROVED);

      // Verify reservation and loan creation with owner tags
      const loans = await adapter.listLoans();
      expect(loans.length).toBe(1);
      const loan = loans[0];
      expect(loan.status).toBe(LOAN_STATUS.RESERVED);
      expect(loan.borrowerProfileId).toBe('demo-borrower');
      expect(loan.ownerProfileId).toBe('demo-owner-tools');

      // STEP 3: Owner records collection handover condition
      const handedOverLoan = await adapter.recordCollectionHandover(borrowRequest.id, {
        conditionGrade: 4,
        conditionNotes: 'Drill verified with both lithium battery packs charged. Minor chuck scuff noted.',
      });
      expect(handedOverLoan.collectionCheckpoint.conditionGrade).toBe(4);
      expect(handedOverLoan.collectionCheckpoint.ownerRecordedAt).toBeDefined();

      // STEP 4: Borrower confirms receipt
      const activeLoan = await adapter.confirmCollectionReceipt(borrowRequest.id, {
        observation: 'Received in clean carrying case with charger.',
      });
      expect(activeLoan.status).toBe(LOAN_STATUS.ACTIVE);
      expect(activeLoan.collectionCheckpoint.borrowerReviewedAt).toBeDefined();

      // STEP 5: Borrower marks item returned
      const returnedLoan = await adapter.markLoanReturned(borrowRequest.id);
      expect(returnedLoan.returnCheckpoint.borrowerReturnMarkedAt).toBeDefined();

      // STEP 6: Owner completes return inspection
      const completedLoan = await adapter.completeReturnInspection(borrowRequest.id, {
        conditionGrade: 4,
        conditionNotes: 'Returned in clean condition with both batteries intact.',
      });
      expect(completedLoan.status).toBe(LOAN_STATUS.COMPLETED);
      expect(completedLoan.returnCheckpoint.conditionGrade).toBe(4);
      expect(completedLoan.completedAt).toBeDefined();

      // Target item is restored to AVAILABLE
      const refreshedItem = await adapter.getItemById('demo-cordless-drill');
      expect(refreshedItem.availability).toBe('AVAILABLE');
    });

    it('renders profile-filtered listings in LendingPage for each demonstration owner', async () => {
      await seedDemoMarketplace(adapter);

      // Wrapper component simulating active profile in context
      function TestLendingWithProfile({ profileId }) {
        return (
          <DemoProfileProvider>
            <Consumer profileId={profileId} />
          </DemoProfileProvider>
        );
      }

      function Consumer({ profileId }) {
        const { setActiveProfileId } = useDemoProfile();
        React.useEffect(() => {
          setActiveProfileId(profileId);
        }, [profileId, setActiveProfileId]);

        return <LendingPage adapter={adapter} />;
      }

      // 1. Demo Borrower has 0 owned items
      const { unmount: unmountBorrower } = render(
        <TestLendingWithProfile profileId="demo-borrower" />,
      );
      expect(await screen.findByRole('heading', { name: /No items listed yet/i })).toBeInTheDocument();
      expect(screen.getByText(/Total Owned/i)).toBeInTheDocument();
      expect(screen.queryByText('Cordless Compact Drill/Driver')).not.toBeInTheDocument();
      unmountBorrower();

      // 2. Demo Owner — Tools has 5 owned items
      const { unmount: unmountTools } = render(
        <TestLendingWithProfile profileId="demo-owner-tools" />,
      );
      expect(await screen.findByText('Cordless Compact Drill/Driver')).toBeInTheDocument();
      expect(screen.getByText('Rechargeable Precision Electric Screwdriver Kit')).toBeInTheDocument();
      expect(screen.getByText('Cordless Impact Driver')).toBeInTheDocument();
      expect(screen.getByText('Wet and Dry Workshop Vacuum')).toBeInTheDocument();
      unmountTools();
    });
  });

  describe('4. Demonstration Marketplace Reset Safeguard', () => {
    it('purges demo requests and demo loans, resets catalogue to Available, and strictly preserves user listings', async () => {
      await seedDemoMarketplace(adapter);

      // 1. Create a simulated user listing
      await adapter.createItem({
        id: 'user-custom-telescoping-ladder',
        title: 'User Telescoping Ladder 12ft',
        description: 'Personal aluminum ladder with locking rungs.',
        category: 'TOOLS',
        conditionGrade: 4,
        approximateArea: 'Personal Area',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        isDemo: false,
        demoSeed: false,
        photoAttestation: true,
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Create a demo request
      await adapter.createBorrowRequest({
        itemId: 'demo-cordless-drill',
        borrowerAlias: 'Student Tester',
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        borrowerProfileId: 'demo-borrower',
        ownerProfileId: 'demo-owner-tools',
        isDemoRequest: true,
      });

      expect((await adapter.listBorrowRequests()).length).toBe(1);
      expect(await adapter.countItems()).toBe(21); // 20 demo + 1 user

      // 3. Execute demo marketplace reset
      const resetResult = await resetDemoMarketplace(adapter);
      expect(resetResult.resetItems).toBe(20);

      // Demo requests purged
      const remainingRequests = await adapter.listBorrowRequests();
      expect(remainingRequests.length).toBe(0);

      // Demo loans purged
      const remainingLoans = await adapter.listLoans();
      expect(remainingLoans.length).toBe(0);

      // User item strictly preserved
      const retrievedUserItem = await adapter.getItemById('user-custom-telescoping-ladder');
      expect(retrievedUserItem).toBeDefined();
      expect(retrievedUserItem.title).toBe('User Telescoping Ladder 12ft');

      // Total count remains 21 (20 demo restored + 1 user)
      expect(await adapter.countItems()).toBe(21);
    });
  });
});
