# BorrowNest

> **Share what you own. Borrow what you need.**

BorrowNest is an open-source, local-first item-sharing and lending coordination application. It helps individuals and local community members catalog useful household and workshop equipment, submit structured borrowing requests, agree on loan durations, coordinate item collection and returns, and maintain transparent, objective item condition records across physical handovers.

[![BorrowNest CI](https://github.com/muhammadtaimoorajmal/BorrowNest/actions/workflows/ci.yml/badge.svg)](https://github.com/muhammadtaimoorajmal/BorrowNest/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/muhammadtaimoorajmal/BorrowNest/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/muhammadtaimoorajmal/BorrowNest/actions/workflows/deploy-pages.yml)
[![Release v0.1.0](https://img.shields.io/badge/release-v0.1.0-blue.svg)](https://github.com/muhammadtaimoorajmal/BorrowNest/releases/tag/v0.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

- **Live Application**: [https://muhammadtaimoorajmal.github.io/BorrowNest/](https://muhammadtaimoorajmal.github.io/BorrowNest/)
- **GitHub Repository**: [https://github.com/muhammadtaimoorajmal/BorrowNest](https://github.com/muhammadtaimoorajmal/BorrowNest)
- **First Official Release**: [v0.1.0 Release Notes](https://github.com/muhammadtaimoorajmal/BorrowNest/releases/tag/v0.1.0)

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
- **Deployment & Automation**: GitHub Actions CI Workflow and GitHub Pages automated deployment

### Local-First Architectural Boundary
BorrowNest is architected as a **purely client-side, local-first prototype**:
- **Local-First Prototype Limitation**: BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser. It does not yet publish items to a shared online marketplace or synchronize data between users.
- **Browser-Local Storage**: All data is stored directly in the visitor's individual browser environment using native IndexedDB across three dedicated stores: `items`, `borrowingRequests`, and `loans`. Photographs are preserved as native Blobs within item records and loan condition checkpoints. Records persist across browser sessions until explicitly cleared.
- **No Cloud Backend**: BorrowNest does **not** connect to a remote cloud database, central API server, or external telemetry service.
- **Local Perspectives**: Borrower and owner perspectives are local task views within the visitor's browser environment, not authenticated multi-tenant user accounts or remote network actors.
- **No Cross-Device Synchronization**: Data created in one browser or device does not automatically sync to another visitor's browser or device.
- **Backup & Portability**: Users can export and restore their complete local dataset at any time as a validated, portable JSON backup (`#account` tab) to migrate between devices or guard against browser storage eviction. Backups are exported as unencrypted JSON archives with base64 image Blobs; users are advised to store backup files securely.

---

## Prototype Scope & Completed Modules

BorrowNest has completed all six planned functional application modules (Modules 01–06):

| Module | Scope | Status |
| :--- | :--- | :--- |
| **Module 01** | Project foundation, identity, architectural principles, repository setup, and CI automation | **Completed** |
| **Module 02** | Formal Question-Option-Criteria (QOC) design rationale across 6 key architectural decision areas ([docs/design-rationale/](docs/design-rationale/)) | **Completed** |
| **Module 03** | Genuine item listing management, native IndexedDB persistence, photo processing, and backup/restore | **Completed & Verified** |
| **Module 04** | Unified item discovery, category browsing, search filtering, and modal detail inspection | **Completed & Verified** |
| **Module 05** | Structured borrowing requests, owner approval workflow, date scheduling, and overlap prevention | **Completed & Verified** |
| **Module 06** | Physical handover condition inspection, return verification handshake, side-by-side comparison, and uncollected release | **Completed & Verified** |

### Key Implemented Capabilities
- **Decoupled State Machine**: Distinct separation between immutable request decisions (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`) and physical loan lifecycles (`RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`).
- **Physical Collection Handover Protocol**: Owner records initial physical handover condition (1–5 tier, observations, photos); borrower inspects the item and confirms receipt (`confirmCollectionReceipt`), transitioning the loan to `ACTIVE` and stamping `collectedAt`.
- **Physical Return & Inspection Protocol**: Borrower marks the item physically returned (`borrowerReturnMarkedAt`); owner conducts a standardized return condition inspection (1–5 tier, observations, photos) and closes the loan to `COMPLETED` (`completeReturnInspection`), stamping `completedAt` and unlocking calendar dates.
- **Side-by-Side Condition Comparison View (DR-04 Option C)**: 3-column comparative view across Listing Baseline, Collection Handover, and Return Inspection with objective delta summary pills and explicit peer transparency disclaimers.
- **Uncollected Reservation Release**: Explicit owner resolution workflow (`releaseUncollectedReservation`) for approved reservations whose pickup window elapsed without collection, transitioning status to `RELEASED_NOT_COLLECTED` and safely unlocking calendar dates without deleting audit history.
- **Relational Integrity Safeguards**: Deleting items with request or loan history is permanently blocked (`ItemHasRequestHistoryError`). Archiving items is blocked while associated loans are in `RESERVED` or `ACTIVE`, but is permitted when all associated loans are `COMPLETED` or `RELEASED_NOT_COLLECTED`.
- **IndexedDB Schema Version 3 & Multi-Store Backup Version 3**: Dedicated `items`, `borrowingRequests`, and `loans` stores with indexes, non-destructive migration, and version 3 backup/restore serializing all records atomically.

---

## Privacy Principles & Genuine Asset Policy

- **Data Minimization**: BorrowNest requests only information strictly necessary for lending coordination.
- **Collection Privacy (DR-05)**: Only coarse neighborhood or landmark areas are collected and displayed (e.g. "Greenwood / Pine St area"). Exact residential street addresses and lockbox codes are strictly prevented via heuristic warning safeguards.
- **EXIF & Metadata Stripping**: Uploaded photos are stripped of all camera metadata, embedded GPS coordinates, and device identifiers client-side before storage.
- **Genuine Imagery & Curated Example Catalogue**: BorrowNest strictly prohibits synthetic AI renders. All user listings rely exclusively on genuine photographs captured directly by item owners. For first-time visitors, BorrowNest provides a curated 20-item read-only demonstration catalogue featuring genuine physical photography across five equipment categories (Tools: 5, Gardening: 4, Household: 4, Outdoor: 4, Electronics: 3) with local asset storage, a compiled visual contact sheet ([docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp](docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp)), and documented attributions ([docs/assets/DEMO_IMAGE_ATTRIBUTIONS.md](docs/assets/DEMO_IMAGE_ATTRIBUTIONS.md)).
- **Accessibility Baseline**: Built with semantic HTML, ARIA landmarks, and keyboard navigation targeting WCAG 2.2 Level AA, with mobile touch targets meeting or exceeding 44 × 44 CSS pixels.

---

## Verification & Quality Gates

The codebase has undergone verification across all engineering dimensions:

| Gate | Tooling | Status | Details |
| :--- | :--- | :--- | :--- |
| **Linting** | ESLint 10 | **Passing** | 0 errors, 0 warnings across all JavaScript and JSX source files |
| **Automated Tests** | Vitest 5 + Testing Library | **Passing** | 234 automated tests passing across 29 test suites |
| **Design Tokens** | `npm run check:tokens` | **Passing** | 146 global custom properties verified across 31 CSS files |
| **Catalogue Integrity** | `npm run check:catalogue` | **Passing** | Exactly 20 products, 5/4/4/4/3 category balance, 20 verified local images |
| **Production Build** | Vite 8 | **Passing** | Clean, optimized production bundle built in ~450ms |
| **Production Audit** | `npm audit --omit=dev` | **Passing** | 0 vulnerabilities in production runtime dependencies |
| **Pages Deployment** | GitHub Actions | **Automated** | Build and deploy pipeline targeting GitHub Pages |

### Known Development Dependency Advisory
- A high-severity advisory (`GHSA-fc5q-39xc-vjpf`) exists in transitive development dependency `picomatch` used by `vite` and `vitest` during local build/test execution.
- This advisory affects only local build-time glob parsing and is **not** included in the client bundle.
- Runtime production dependencies have **0 vulnerabilities** (`npm audit --omit=dev`). Details are tracked in [docs/design-rationale/TECHNICAL_RISK_REGISTER.md](docs/design-rationale/TECHNICAL_RISK_REGISTER.md).

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
npm ci
```

### Development Scripts

- `npm run dev`: Launch the local development server with hot module reloading.
- `npm run build`: Compile the production application bundle into `dist/`.
- `npm run lint`: Verify code style and syntax rules using ESLint.
- `npm run check:tokens`: Verify design token integrity across all CSS modules.
- `npm run check:catalogue`: Validate the 20-item catalogue data, categories, and local image assets.
- `npm run test`: Run the full automated test suite with Vitest.
- `npm run preview`: Preview the compiled production build locally.

---

## Academic Context & HCI Lab 11 Deliverables

BorrowNest serves as the primary case study for **Course SE2613 (Human-Computer Interaction)**, Department of Computer Science, Faculty of Computing, **Riphah International University** (Fall 2026, Class BSCS 5-1, Student: Muhammad Taimoor Ajmal, SAP ID: 63461, Instructor: Mr. Muhammad Shabbir Hassan).

- **Formal Lab 11 Report (Markdown)**: [docs/lab-reports/Lab11_63461_BSCS5-1.md](docs/lab-reports/Lab11_63461_BSCS5-1.md)
- **Formal Lab 11 Report (Word .docx)**: [docs/lab-reports/Lab11_63461_BSCS5-1.docx](docs/lab-reports/Lab11_63461_BSCS5-1.docx)
- **Design Rationale Register**: [docs/design-rationale/DECISION_LOG.md](docs/design-rationale/DECISION_LOG.md)
- **Final Project Completion Report**: [docs/PROJECT_COMPLETION_REPORT.md](docs/PROJECT_COMPLETION_REPORT.md)

---

## Deployment

BorrowNest is automatically built and deployed to GitHub Pages via GitHub Actions:
- **Live URL**: [https://muhammadtaimoorajmal.github.io/BorrowNest/](https://muhammadtaimoorajmal.github.io/BorrowNest/)
- **Deployment Documentation**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full configuration and workflow details.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
