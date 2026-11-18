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

BorrowNest has completed **Module 03 (Genuine Item Listing Management & Local Persistence)**:
- **Responsive 4-Section Application Shell**: Top desktop navbar and bottom mobile navbar with 48px touch targets (exceeding WCAG 44×44px minimum) navigating across `#discover`, `#borrowing`, `#lending`, and `#account`.
- **Genuine Item Management**: Complete creation, editing, availability toggling, archiving, restoring, and deletion confirmation workflows.
- **Native IndexedDB Persistence**: Structured transactional persistence store (`BorrowNest` v1) indexed by status, category, and timestamps.
- **Privacy-Preserving Photo Pipeline**: Bounded proportional downscaling (max 1600px), complete EXIF and GPS metadata stripping via Canvas re-encoding, WebP/JPEG compression, and mandatory accessibility descriptions (`altText`).
- **Data Portability**: Full JSON backup export (`borrownest-backup` v1) and schema-validated restore supporting both non-destructive merge and clean replace modes.
- **No Mock Data**: Per our mandatory data-integrity policy, the application does not ship with pre-populated fake items, synthetic users, or artificial activity feeds.
- **Future Module Roadmap**: Full catalog discovery and search are scheduled for Module 04; structured borrowing requests and calendar scheduling for Module 05; and handover condition inspection protocols for Module 06.

---

## Privacy Principles & Genuine Asset Policy

- **Data Minimization**: BorrowNest requests only information strictly necessary for lending coordination.
- **Collection Privacy**: Only coarse neighborhood or landmark areas are collected and displayed. Exact residential street addresses and private lockbox codes are strictly prevented via real-time heuristic warning safeguards (DR-05).
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
| **Module 04** | Discovery, category browsing, and search filtering | Planned |
| **Module 05** | Request submission, owner approval flow, and loan period scheduling | Planned |
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
