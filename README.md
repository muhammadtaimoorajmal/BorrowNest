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
- Protect personal privacy by keeping sensitive collection details private until a request is confirmed.

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

BorrowNest has completed **Module 05 (Structured Borrowing Requests, Owner Approval & Date-Range Scheduling)**:
- **Borrower Request Submission Workflow**: Integrated borrower request dialog triggered directly from catalog discovery (`ItemDetailModal` -> `BorrowRequestDialog`), displaying item summaries, checking real-time schedule availability, and recording structured requests.
- **Owner Consent Decision Workflow (DR-02)**: Complete owner review workflow featuring explicit Approve and Decline actions, accessible confirmation modals, and immutable terminal states preventing uncoordinated alterations.
- **Date-Range Scheduling & Conflict Prevention (DR-03)**: Exact calendar date scheduling using native date inputs (`YYYY-MM-DD`) with strict inclusive date interval overlap prevention (`candidateStart <= existingReturn && existingStart <= candidateReturn`).
- **Transactional Atomic Approval Serialization**: Competing or concurrent approval attempts open a single `readwrite` IndexedDB transaction across both `items` and `borrowingRequests`, re-validating item availability and calendar conflicts at approval time to guarantee zero double-booking.
- **Overdue Safety Hold**: Approved reservations whose return deadline has passed remain locked and flagged with clear overdue notices, preventing new conflicting bookings until physical return completion in Module 06.
- **Relational Integrity Safeguards**: Deleting items that possess borrowing request history is strictly blocked (`ItemHasRequestHistoryError`), and archiving items with active or approved reservations is prevented (`ItemHasActiveReservationError`).
- **Dual-Perspective Borrowing Workspace**: Dedicated Borrowing workspace providing both **Borrower View (My Requests)** with cancellation controls for pending requests, and **Owner View (Incoming Requests)** with decision controls and active reservation schedules, backed by honest local-first disclosures.
- **Lending Workspace Integration**: Dedicated "Incoming Requests" tab alongside Active and Archived listings, displaying real-time pending request count badges.
- **Backup & Restore Schema Version 2**: Versioned multi-store JSON archive format serializing items, photos, and borrowing requests, with full backward compatibility for version 1 backups and atomic replace/merge transactions.
- **Future Module Roadmap**: Handover physical inspection, condition photo comparisons, and return verification protocols for Module 06.

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
| **Module 06** | Handover inspection, condition documentation, and return completion | Planned |

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
