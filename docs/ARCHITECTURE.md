# BorrowNest — System Architecture

## 1. Architectural Philosophy

BorrowNest is designed around three architectural pillars:
1. **Local-First & Client-Centric**: The user's device is the primary source of truth. All operations, records, and state transitions occur client-side without relying on an ongoing server connection.
2. **Component Modularity & Separation of Concerns**: Presentational components, interaction state, storage adapters, and domain validation are isolated to preserve long-term maintainability.
3. **Genuine Data Integrity**: The architecture deliberately rejects synthetic mock generators, third-party analytics trackers, and fake populated fixtures in production code.

---

## 2. Technology Stack Selection

- **UI Framework**: React 19 (Functional components, React Hooks).
- **Build System & Dev Server**: Vite 8 (Fast ESM-based dev server, optimized Rollup bundling).
- **Styling Architecture**:
  - Global CSS tokens (`src/styles/tokens.css`): Centralizes brand palette, spacing scale, font stacks, radii, and elevations.
  - Reset & Baseline (`src/styles/global.css`): Box sizing, standard typographic hierarchy, focus rings, accessibility utilities.
  - Scoped CSS Modules (`*.module.css`): Encapsulates component styles without global class pollution or runtime CSS-in-JS overhead.
- **Testing Framework**: Vitest 5 with React Testing Library and JSDOM.
- **Static Code Analysis**: ESLint 10 (Flat Config) with React and React Hooks plugins.
- **CI / CD Pipeline**: Official GitHub Actions runner (`.github/workflows/ci.yml`).

---

## 3. Repository Structure

```text
BorrowNest/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow (lint, test, build)
├── docs/                        # Architectural and governance documentation
│   ├── design-rationale/        # Formal QOC decisions and blueprints (Module 02)
│   │   ├── README.md
│   │   ├── QOC_METHOD_AND_SCORING.md
│   │   ├── DR-01_ITEM_DISCOVERY.md
│   │   ├── DR-02_BORROWING_APPROVAL.md
│   │   ├── DR-03_AVAILABILITY_SCHEDULING.md
│   │   ├── DR-04_CONDITION_HANDOVER.md
│   │   ├── DR-05_LOCATION_PRIVACY.md
│   │   ├── DR-06_RESPONSIVE_NAVIGATION.md
│   │   ├── DECISION_LOG.md
│   │   ├── EVIDENCE_REGISTER.md
│   │   ├── TRACEABILITY_MATRIX.md
│   │   ├── SELECTED_DESIGN_BLUEPRINT.md
│   │   └── TECHNICAL_RISK_REGISTER.md
│   ├── ARCHITECTURE.md
│   ├── ASSET_POLICY.md
│   ├── DESIGN_DECISION_AREAS.md
│   ├── PRIVACY_AND_DATA_POLICY.md
│   ├── PRODUCT_OVERVIEW.md
│   ├── PRODUCT_REQUIREMENTS.md
│   └── PRODUCT_SCOPE.md
├── public/                      # Static web assets
│   ├── borrownest-logo.svg      # Original brand vector asset
│   └── favicon.svg              # Browser tab icon
├── src/                         # Application source code
│   ├── components/              # Shared Presentational Components
│   │   ├── BrandMark.jsx        # SVG brand mark & wordmark
│   │   ├── BrandMark.module.css
│   │   ├── EmptyState.jsx       # Honest zero-state presentation
│   │   ├── EmptyState.module.css
│   │   ├── Footer.jsx           # Application footer
│   │   ├── Footer.module.css
│   │   ├── Header.jsx           # Responsive application header
│   │   └── Header.module.css
│   ├── features/                # Domain Feature Slices
│   │   ├── account/             # Account & Local Storage Management
│   │   │   └── pages/
│   │   │       ├── AccountPage.jsx
│   │   │       └── AccountPage.module.css
│   │   ├── borrowing/           # Structured Requests & Scheduling (Module 05 Implemented)
│   │   │   ├── components/
│   │   │   │   ├── BorrowRequestDialog.jsx
│   │   │   │   ├── BorrowRequestDialog.module.css
│   │   │   │   ├── BorrowRequestDialog.test.jsx
│   │   │   │   ├── RequestActionConfirmDialog.jsx
│   │   │   │   ├── RequestActionConfirmDialog.module.css
│   │   │   │   ├── RequestCard.jsx
│   │   │   │   ├── RequestCard.module.css
│   │   │   │   ├── RequestStatusBadge.jsx
│   │   │   │   └── RequestStatusBadge.module.css
│   │   │   ├── constants/
│   │   │   │   └── requestStatus.js
│   │   │   ├── hooks/
│   │   │   │   └── useBorrowRequests.js
│   │   │   ├── pages/
│   │   │   │   ├── BorrowingPage.jsx
│   │   │   │   ├── BorrowingPage.module.css
│   │   │   │   └── BorrowingPage.test.jsx
│   │   │   ├── services/
│   │   │   │   ├── borrowRequestValidation.js
│   │   │   │   ├── borrowRequestValidation.test.js
│   │   │   │   ├── dateRange.js
│   │   │   │   └── dateRange.test.js
│   │   │   ├── BorrowingIntegration.test.jsx
│   │   │   └── BorrowingPlaceholder.jsx
│   │   ├── discover/            # Item Catalog & Discovery (Module 04 Implemented)
│   │   │   ├── components/
│   │   │   │   ├── AvailabilityFilter.jsx
│   │   │   │   ├── AvailabilityFilter.module.css
│   │   │   │   ├── CategoryFilters.jsx
│   │   │   │   ├── CategoryFilters.module.css
│   │   │   │   ├── DiscoveryCard.jsx
│   │   │   │   ├── DiscoveryCard.module.css
│   │   │   │   ├── DiscoveryEmptyState.jsx
│   │   │   │   ├── DiscoveryEmptyState.module.css
│   │   │   │   ├── DiscoveryNoResults.jsx
│   │   │   │   ├── DiscoveryNoResults.module.css
│   │   │   │   ├── DiscoverySearch.jsx
│   │   │   │   ├── DiscoverySearch.module.css
│   │   │   │   ├── ItemDetailModal.jsx
│   │   │   │   └── ItemDetailModal.module.css
│   │   │   ├── hooks/
│   │   │   │   └── useDiscovery.js
│   │   │   ├── pages/
│   │   │   │   ├── DiscoverPage.jsx
│   │   │   │   ├── DiscoverPage.module.css
│   │   │   │   └── DiscoverPage.test.jsx
│   │   │   ├── services/
│   │   │   │   ├── filterListings.js
│   │   │   │   ├── filterListings.test.js
│   │   │   │   ├── normalizeSearch.js
│   │   │   │   └── normalizeSearch.test.js
│   │   │   ├── DiscoverIntegration.test.jsx
│   │   │   ├── DiscoverPlaceholder.jsx
│   │   │   └── Placeholder.module.css
│   │   └── listings/            # Genuine Item Management (Module 03 Implemented)
│   │       ├── components/
│   │       │   ├── DeleteConfirmDialog.jsx
│   │       │   ├── DeleteConfirmDialog.module.css
│   │       │   ├── ListingCard.jsx
│   │       │   ├── ListingCard.module.css
│   │       │   ├── ListingDetailModal.jsx
│   │       │   ├── ListingDetailModal.module.css
│   │       │   ├── ListingForm.jsx
│   │       │   └── ListingForm.module.css
│   │       ├── hooks/
│   │       │   └── useListings.js
│   │       ├── pages/
│   │       │   ├── LendingPage.jsx
│   │       │   ├── LendingPage.module.css
│   │       │   └── LendingPage.test.jsx
│   │       ├── services/
│   │       │   ├── processItemImage.js
│   │       │   └── processItemImage.test.js
│   │       └── validation/
│   │           ├── itemValidation.js
│   │           └── itemValidation.test.js
│   ├── navigation/              # Responsive Navigation Subsystem (DR-06)
│   │   ├── Navbar.jsx
│   │   ├── Navbar.module.css
│   │   ├── navigationConstants.js
│   │   └── navigation.test.jsx
│   ├── services/                # Cross-Cutting Infrastructure Services
│   │   ├── backup/              # Local JSON Export & Validated Restore
│   │   │   ├── backupSchema.js
│   │   │   ├── exportBackup.js
│   │   │   ├── importBackup.js
│   │   │   └── backup.test.js
│   │   └── storage/             # Abstract & Concrete Storage Layer
│   │       ├── database.js
│   │       ├── IndexedDbStorageAdapter.js
│   │       ├── IndexedDbStorageAdapter.test.js
│   │       ├── StorageAdapter.js
│   │       └── storageErrors.js
│   ├── styles/                  # Global CSS foundations
│   │   ├── global.css           # Typography, reset, and a11y utilities
│   │   └── tokens.css           # Custom properties design system
│   ├── test/                    # Test configuration and setup
│   │   └── setup.js             # Fake-IndexedDB and canvas mock setup
│   ├── App.jsx                  # Root application shell & hash router
│   ├── App.module.css
│   ├── App.test.jsx             # Shell verification test suite
│   └── main.jsx                 # Client entry point
├── .editorconfig                # Universal indentation and whitespace rules
├── .gitignore                   # Repository exclusion patterns
├── eslint.config.js             # Flat ESLint rules configuration
├── index.html                   # HTML document root
├── LICENSE                      # MIT Open-Source License
├── package.json                 # Project dependencies and script declarations
├── README.md                    # Project documentation entry point
└── vite.config.js               # Vite and Vitest configuration
```

---

## 4. Conceptual Data Entities

While Module 01 establishes the foundational shell, the data architecture anticipates four core domain models for subsequent modules:

```mermaid
erDiagram
    ITEM {
        string id PK
        string title
        string description
        string category
        string conditionGrade
        string conditionNotes
        string approximateArea
        string availabilityStatus
        string createdAt
    }
    BORROW_REQUEST {
        string id PK
        string itemId FK
        string requestedBy
        string startDate
        string endDate
        string requestNote
        string status
        string createdAt
    }
    LOAN_RECORD {
        string id PK
        string requestId FK
        string collectedAt
        string conditionAtCollection
        string returnedAt
        string conditionAtReturn
        string handoverNotes
    }
    ITEM ||--o{ BORROW_REQUEST : receives
    BORROW_REQUEST ||--o| LOAN_RECORD : transitions_to
```

### Key Entity Descriptions:
1. **Item**: Represents a tangible good offered for lending. Stores public metadata (title, category, condition) and coarse neighborhood locality (per DR-05; exact street addresses are deliberately not stored).
2. **BorrowRequest**: Encapsulates a proposed loan period, borrower identification, and current decision status (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`).
3. **LoanRecord**: Tracks the physical lifecycle of an approved loan, capturing timestamped collection, condition verification, return timestamp, and closing notes.

---

## 5. State Management & Local-First Strategy

- **Module 01 Baseline**: Lightweight React local state and semantic components.
- **Module 03 Persistence Architecture**:
  - **Decoupled Storage Layer**: Storage operations are strictly abstracted behind `StorageAdapter`, an abstract interface defining transactional CRUD, archiving, restoration, counting, and bulk batch operations.
  - **Native IndexedDB Adapter**: `IndexedDbStorageAdapter` provides the production browser persistence engine using the native `BorrowNest` database (schema version 1) and `items` object store. It utilizes secondary indexes on `status`, `category`, `createdAt`, and `updatedAt`. All write operations commit deterministically on transaction completion (`tx.oncomplete`), ensuring ACID durability.
  - **Custom Reactive Hook**: `useListings` encapsulates reactive item state, lifecycle mutations, loading and error states, and live stats computation without component-level storage coupling.
  - **Privacy-Preserving Media Pipeline**: `processItemImage` sanitizes owner-uploaded photographs client-side. Using an in-memory HTML5 Canvas, raw image pixels are re-encoded into clean WebP/JPEG Blobs (bounded to 1600px and 2.5MB), completely stripping EXIF metadata, camera serial numbers, and embedded GPS coordinates before persistence.
  - **Data Portability & Backup Subsystem**: `exportBackup` and `importBackup` enable client-side JSON serialization (`borrownest-backup` format v1) with base64 photo rehydration, schema validation, and both non-destructive merge and clean replace restore strategies.
- **Module 04 Discovery & Search Architecture (DR-01)**:
  - **Unified Discovery Engine**: `filterListings` executes client-side filtering over active, non-archived items from IndexedDB. It combines tokenized keyword search across title, description, category, and approximate area with categorical pills (`ALL`, `TOOLS`, `GARDENING`, `HOUSEHOLD`, `OUTDOOR`, `ELECTRONICS`) and an availability facet toggle (`availableOnly`).
  - **Token Normalization Service**: `normalizeSearchText` and `tokenizeQuery` perform Unicode NFKC normalization, lowercase conversion, and whitespace collapsing, ensuring resilient search without external dependencies.
  - **Reactive Discovery Hook**: `useDiscovery` encapsulates catalog retrieval, active item derivation, memoized filter execution, active filter detection, and filter reset handlers.
  - **Accessible Presentation & Modals**: `DiscoveryCard` provides a strictly read-only presentation for public catalog exploration (excluding owner actions). `ItemDetailModal` provides an accessible dialog (`role="dialog"`, `aria-modal="true"`) for comprehensive inspection with keyboard navigation, image gallery viewing, and condition notes review.
  - **Honest States**: Honest empty state when 0 active items exist in the library (directing users to the Lending workspace) and dedicated zero-results recovery state when active filters match 0 items.
- **Module 03 Quality & Stabilization Upgrades**:
  - **Atomic Backup Replacement**: `replaceAllItems` executes `clear()` and all item inserts within a single atomic `readwrite` IndexedDB transaction, guaranteeing all-or-nothing rollback on any failure.
  - **Merge Error Propagation**: Explicit error filtering ensures unexpected storage errors surface visibly during backup restore rather than being swallowed silently.
  - **Imported Photo Validation & Re-processing**: Backup import validates MIME types, enforces accessible `altText`, and re-processes image blobs through the client-side Canvas pipeline to guarantee EXIF stripping and size boundaries.
  - **Request Sequencing**: Monotonic counter sequencing in `useListings` prevents race conditions from overlapping asynchronous fetches from overwriting newer state updates.

- **Module 05 Borrowing Requests & Date-Range Scheduling Architecture (DR-02 & DR-03)**:
  - **IndexedDB Schema Version 2 Upgrade**: The native `BorrowNest` database is upgraded to version 2 with a non-destructive migration that preserves all legacy items and media intact while establishing the `borrowingRequests` store with indexes on `itemId`, `status`, `startDate`, `endDate`, `collectionDate`, `returnDeadline`, and `createdAt`. Added `db.onversionchange = () => db.close();` for multi-tab durability.
  - **Borrowing State Machine**: Deterministic progression: `PENDING` $\rightarrow$ `APPROVED` | `DECLINED` | `CANCELLED`. Terminal states are strictly immutable; requests cannot be re-opened once closed.
  - **Inclusive Date-Range Overlap Prevention**: Implements the strict interval intersection formula `candidateStart <= existingReturn && existingStart <= candidateReturn`. A shared boundary day (e.g. returning on Dec 5 while another starts on Dec 5) is strictly treated as an overlapping conflict to guarantee physical handover feasibility.
  - **Transactional Concurrency Serialization**: Approving a request opens a single atomic `readwrite` transaction over both `[items, borrowingRequests]`. It re-verifies item availability and checks all other approved requests for date conflicts before writing `APPROVED`, guaranteeing that concurrent competing approvals serialize deterministically into exactly one approval and one `ReservationConflictError`.
  - **Overdue Safety Hold**: Any approved reservation whose return deadline is in the past remains locked to block new overlapping bookings until physical condition inspection and return completion in Module 06.
  - **Relational Integrity Guards**: Deleting an item with associated borrowing request history is blocked (`ItemHasRequestHistoryError`), preserving historical audit records. Archiving an item with an active approved reservation is blocked (`ItemHasActiveReservationError`).
  - **Backup & Restore Version 2**: Extended backup schema version 2 serializing both `items` and `borrowingRequests`. Provides full backward compatibility for version 1 backups, atomic multi-store replacement (`replaceAllData`), and conflict-validating atomic merge (`mergeAllData`).

- **Module 06 Physical Handover, Return Verification & Condition Inspection Architecture (DR-04)**:
  - **IndexedDB Schema Version 3 Upgrade**: Native `BorrowNest` database is upgraded to version 3 adding the `loans` object store with indexes on `itemId`, `status`, `collectionDate`, `returnDeadline`, `createdAt`, `collectedAt`, and `completedAt`. Includes non-destructive migration backfilling legacy `APPROVED` requests as `RESERVED` loans.
  - **Request State vs. Loan State Decoupling**: Request status describes the owner's decision (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`) and remains historically immutable. Loan lifecycle records physical custody separately: `RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`.
  - **Physical Handover Protocol**: Collection handover requires explicit owner handover recording (standardized condition grade, notes, optional photos) followed by borrower physical receipt confirmation before the loan transitions to `ACTIVE` and sets `collectedAt`.
  - **Return Inspection Protocol**: Physical return requires borrower return marking followed by owner standardized return condition inspection before the loan transitions to `COMPLETED` and sets `completedAt`.
  - **Derived Overdue Status**: Overdue is strictly a derived display state for active physical loans past return deadline (`loan.status === 'ACTIVE' && loan.returnDeadline < today`). Uncollected reservations whose deadline passed without physical collection display "Collection not recorded — owner resolution required" and support explicit owner release (`RELEASED_NOT_COLLECTED`).
  - **Structured Condition Checkpoints (DR-04 Option C)**: Standardized 5-tier evaluation across Listing Baseline, Collection Handover, and Return Inspection with notes and optional authentic photos. Side-by-side comparison interface provides objective transition indicators without subjective fault or liability attribution, accompanied by transparent local disclosures.
  - **Relational Safeguards**: Item deletion is permanently blocked if any request or loan history exists. Item archiving is blocked while associated loans are in `RESERVED` or `ACTIVE`, but permitted when all associated loans are `COMPLETED` or `RELEASED_NOT_COLLECTED`.
  - **Atomic Three-Store Transactions**: Request approval, uncollected release, backup replacement, and backup merge execute atomically across all three stores `[items, borrowingRequests, loans]`.
  - **Backup & Restore Schema Version 3**: Serializes `items`, `borrowingRequests`, and `loans` with checkpoint photographs. Provides backwards compatibility for v1 and v2, and strictly requires atomic multi-store transaction execution.
  - **Monotonic Request Sequencing**: Request sequencing in `useBorrowRequests` guards against race conditions across asynchronous multi-store mutations.

---

## 6. Technical Constraints & Trade-offs

1. **Client-Side Storage Volatility**: Local browser storage can be cleared by user action or browser cache management. Mitigation: Module 03 implements single-click JSON export/backup and validated restore via the Account page. Backups are exported as unencrypted JSON archives and users are advised to store them securely.
2. **Local-First Prototype Limitation**: BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser. It does not yet publish items to a shared online marketplace or synchronize data between users. Borrower and Owner views represent local task perspectives within this browser environment; requests are not sent to remote devices.
3. **Asset Storage Size**: Local storage has memory quotas (typically several GB for `IndexedDB`). Mitigation: user-uploaded photographs are resized to a maximum dimension of 1600px and re-compressed to WebP/JPEG Blobs under 2.5MB client-side.
4. **Coarse Location Boundary**: In accordance with DR-05, listings require broad neighborhood tags and feature real-time heuristic pattern detection warning users against entering specific street addresses or gate codes.
