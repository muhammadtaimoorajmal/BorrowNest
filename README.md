# BorrowNest

> **Share what you own. Borrow what you need.**

BorrowNest is an open-source, local-first item-sharing and lending coordination application. It helps individuals and small communities organize useful household and workshop equipment, log borrowing requests, agree on loan durations, coordinate item collection and returns, and maintain transparent item-condition records.

---

## The Problem and Our Solution

### Problem
Household equipment, power tools, gardening implements, and seasonal items are frequently purchased for short-term tasks and remain idle for extended periods. Meanwhile, neighbors and peers who need those tools temporarily often face purchasing costs or difficulty finding someone nearby willing to lend them.

### Solution
BorrowNest provides a focused coordination workspace to:
- Make locally available tools and equipment discoverable.
- Provide clear records of borrowing periods and expected return dates.
- Keep item owners in full control of borrowing approvals.
- Record item condition transparently before and after a loan.
- Protect personal privacy by using coarse neighborhood area indicators only, eliminating exact address harvesting and location leakage by design (DR-05).

---

## Technical Stack & Architecture

- **Framework**: React 19 (JavaScript / JSX)
- **Tooling & Build**: Vite 8
- **Styling**: Standard CSS Custom Properties (Design Tokens) and CSS Modules
- **Local Persistence**: Native Browser IndexedDB via transactional `StorageAdapter`
- **Media Pipeline**: Client-side HTML5 Canvas EXIF/GPS stripping, downscaling, and compression
- **Testing**: Vitest & React Testing Library (JSDOM environment with fake-indexeddb)
- **Code Quality**: ESLint 10 (Flat Config)
- **Deployment & Automation**: GitHub Actions CI Workflow

BorrowNest is architected as a **local-first client-side application**. It stores information directly within the user's browser environment using native IndexedDB and operates without third-party tracking, external telemetry, or mandatory remote cloud backends.

---

## Prototype Boundaries and Current Status

BorrowNest has completed **Module 06 (Physical Handover, Return Verification & Condition Inspection)** — the final planned functional application module:
- **Decoupled Request Decision vs. Physical Custody State Machine**: Request decisions remain immutable records (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`). Physical custody progresses through a dedicated `loans` store: `RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`.
- **Physical Collection Handover Protocol**: Owner records initial physical handover condition (1–5 tier, observations, max 5 sanitized photos); borrower physically inspects the item and confirms receipt (`confirmCollectionReceipt`), transitioning the loan to `ACTIVE` and stamping `collectedAt`.
- **Physical Return & Inspection Protocol**: Borrower marks the item physically returned; owner conducts a standardized return condition inspection (1–5 tier, observations, photos) and closes the loan to `COMPLETED` (`completeReturnInspection`), stamping `completedAt` and unlocking calendar dates.
- **Side-by-Side Condition Comparison View (DR-04 Option C)**: 3-column comparative view across Listing Baseline, Collection Handover, and Return Inspection with objective delta summary pills and explicit peer transparency disclaimers.
- **Uncollected Reservation Release**: Explicit owner resolution workflow (`releaseUncollectedReservation`) for approved reservations whose pickup window elapsed without collection, transitioning status to `RELEASED_NOT_COLLECTED` and safely unlocking calendar dates without deleting audit history.
- **Derived Overdue Status**: Overdue is strictly a derived display state for active physical loans past their return deadline (`loan.status === 'ACTIVE' && loan.returnDeadline < today`), distinct from uncollected reservations.
- **Relational Integrity Safeguards**: Deleting items with request or loan history remains permanently blocked (`ItemHasRequestHistoryError`). Archiving items is blocked while associated loans are in `RESERVED` or `ACTIVE`, but is permitted when all associated loans are `COMPLETED` or `RELEASED_NOT_COLLECTED`.
- **Lending Workspace Integration**: Dedicated "Items Lent Out" tab alongside Active Listings, Archived, and Incoming Requests, displaying active loan counts and action triggers.
- **IndexedDB Schema Version 3 & Multi-Store Backup Version 3**: Native `loans` store with indexes, non-destructive migration backfilling legacy `APPROVED` requests as `RESERVED` loans, and version 3 backup/restore serializing items, photos, borrowing requests, and loan lifecycles with checkpoint photographs. All multi-store operations execute atomically.
- **Comprehensive Quality Gates**: 207 automated tests passing across 24 test suites with 0 ESLint warnings/errors and clean Vite production build.

---

## Privacy Principles & Genuine Asset Policy

- **Data Minimization**: BorrowNest requests only information strictly necessary for lending coordination.
- **Collection Privacy**: Only coarse neighborhood or landmark areas are collected and displayed. Exact residential street addresses and private lockbox codes are strictly prevented via real-time heuristic warning safeguards (DR-05).
- **Borrower Identity Transparency**: Borrower aliases are explicitly identified as local display names stored client-side rather than cryptographically verified network identities.
- **EXIF & Metadata Stripping**: Uploaded photos are stripped of all camera metadata, embedded GPS coordinates, and device identifiers client-side before storage.
- **Genuine Imagery**: BorrowNest strictly prohibits generic stock photographs, clip art, or synthetic renders. All listings rely exclusively on genuine photographs captured directly by item owners.
- **Design Target**: Built with semantic HTML, ARIA landmarks, and keyboard navigation targeting WCAG 2.2 Level AA, with mobile navigation touch targets meeting or exceeding 44 × 44 CSS pixels.

---

## Feature Roadmap

| Module | Scope | Status |
| :--- | :--- | :--- |
| **Module 01** | Project foundation, identity, architectural principles, repository setup, and CI automation | **Implemented** |
| **Module 02** | Formal Question-Option-Criteria (QOC) design rationale across 6 key architectural decision areas ([docs/design-rationale/](docs/design-rationale/)) | **Implemented** |
| **Module 03** | Genuine item listing management, native IndexedDB persistence, photo processing, and backup/restore | **Implemented & Verified** |
| **Module 04** | Discovery, category browsing, and search filtering | **Implemented & Verified** |
| **Module 05** | Request submission, owner approval flow, and loan period scheduling | **Implemented & Verified** |
| **Module 06** | Handover inspection, condition documentation, and return completion | **Implemented & Verified** |

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended; verified on Node.js v24)
- npm (v10+ recommended; verified on npm v11)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/muhammadtaimoorajmal/BorrowNest.git
cd BorrowNest
npm install
```

### Development Scripts

- `npm run dev`: Launch the Vite local development server with hot module reloading.
- `npm run build`: Compile the production application bundle into `dist/`.
- `npm run lint`: Verify code style and syntax rules using ESLint.
- `npm run test`: Run the test suite with Vitest.
- `npm run preview`: Preview the compiled production build locally.

---

## Contributing

Contributions that adhere to our local-first architecture and genuine data policy are welcome. Please ensure that all pull requests pass `npm run lint`, `npm run test`, and `npm run build`.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
