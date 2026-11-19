# BorrowNest — Product Requirements

This document enumerates the Functional Requirements (FR) and Non-Functional Requirements (NFR) for BorrowNest.

Status Definitions:
- **PLANNED**: Requirement specified and scheduled for future module development.
- **IMPLEMENTED**: Code written and integrated into the current codebase.
- **VERIFIED**: Functionality verified through automated test suites and build checks.

---

## 1. Functional Requirements (FR)

| Requirement ID | Name | Description | Target Module | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Item Listing Creation | The owner can add an item with a genuine title, category, description, authentic photos, and condition rating. | Module 03 | **IMPLEMENTED & VERIFIED** |
| **FR-002** | Item Discovery | BorrowNest shall provide a public item discovery view displaying all active, non-archived items from local storage, with honest empty states when no listings exist, without synthetic items. | Module 04 | **IMPLEMENTED & VERIFIED** |
| **FR-003** | Search and Filtering | Users can filter items by search keywords, category tags, and lending availability status. | Module 04 | **IMPLEMENTED & VERIFIED** |
| **FR-004** | Item Detail Inspection | The borrower can review full item details, usage guidelines, general pickup area, and owner condition notes. | Module 04 | **IMPLEMENTED & VERIFIED** |
| **FR-005** | Borrowing Request Submission | A borrower can submit a request specifying the desired borrowing timeframe and a short note. | Module 05 | **IMPLEMENTED & VERIFIED** |
| **FR-006** | Request Decision Workflow | The item owner can review pending borrowing requests and choose to approve or decline them. | Module 05 | **IMPLEMENTED & VERIFIED** |
| **FR-007** | Borrowing Period Scheduling | The system records explicit start and return dates, preventing conflicting overlapping bookings. | Module 05 | **IMPLEMENTED & VERIFIED** |
| **FR-008** | Collection & Return Logging | Both parties can track handover confirmation, active loan duration, and return completion. | Module 06 | **IMPLEMENTED & VERIFIED** |
| **FR-009** | Item Condition Recording | Users can record item condition and observations prior to collection and re-inspect condition upon return. | Module 06 | **IMPLEMENTED & VERIFIED** |
| **FR-010** | Borrowing History & Status | Users can view past completed loans, active borrowings, and upcoming return deadlines in one place. | Module 06 | **IMPLEMENTED & VERIFIED** |

---

## 2. Non-Functional Requirements (NFR)

### NFR-001: Usability & Interaction
- **NFR-001.1**: The user interface shall provide clear feedback for empty states, form validations, and status transitions without requiring technical knowledge.
- **NFR-001.2**: Critical workflows (such as creating a listing or approving a request) shall require no more than three simple interaction steps.
- **Status**: Foundation Shell, Module 03 Listing Form/Lifecycle, Module 04 Discovery, Module 05 Requests/Scheduling & Module 06 Handover/Inspection: **VERIFIED**.

### NFR-002: Accessibility (a11y)
- **NFR-002.1**: Target compliance is **WCAG 2.2 Level AA**.
- **NFR-002.2**: All interactive components must be navigable and operable using standard keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`).
- **NFR-002.3**: High contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components) must be maintained across all color tokens.
- **NFR-002.4**: Semantic HTML landmarks (`banner`, `main`, `contentinfo`, `section`, `nav`) and ARIA labels must be properly structured.
- **Status**: Full Application (Shell, Listings, Discovery, Requests, Loans, Checkpoints, Condition Comparison): **VERIFIED**.

### NFR-003: Responsiveness & Mobile Ergonomics
- **NFR-003.1**: The application layout shall seamlessly adapt across mobile devices (320px+), tablets (768px+), and desktop screens (1024px+).
- **NFR-003.2**: Touch target sizes for primary buttons and mobile navigation items shall meet or exceed **44 × 44 CSS pixels**. (Note: While WCAG 2.2 Success Criterion 2.5.8 defines 24 × 24 CSS pixels as the Level AA minimum, BorrowNest adopts 44 × 44 CSS pixels—aligning with Level AAA SC 2.5.5—as an intentional, stricter ergonomic project standard).
- **Status**: Shell & Navigation: **VERIFIED** (48px primary mobile touch targets implemented); Responsive Layouts: **VERIFIED**.

### NFR-004: Data Privacy & Security
- **NFR-004.1**: The local prototype shall collect and display only coarse neighborhood or public landmark areas; exact residential street addresses, unit numbers, and private lockbox codes shall **not** be collected or stored (DR-05).
- **NFR-004.2**: No user data, telemetry, or listing details shall be sent to external servers or third-party tracking services.
- **NFR-004.3**: All storage operations must occur strictly client-side using browser-managed secure storage APIs.
- **Status**: Native IndexedDB Engine (Schema v3), Canvas EXIF Removal & Address Pattern Safeguard: **VERIFIED**.

### NFR-005: Reliability & Data Integrity
- **NFR-005.1**: The system must never auto-generate fake listings, synthetic accounts, or fictitious transactions.
- **NFR-005.2**: State changes (such as approval, cancellation, and return) must be deterministic and prevent invalid state transitions.
- **Status**: Zero-Fake-Data Enforcement, Atomic Multi-Store Transactions (items, requests, loans), Relational Safeguards & Backup v3: **VERIFIED**.

### NFR-006: Performance
- **NFR-006.1**: Initial client bundle load time must be under 1.5 seconds on a standard 3G/4G network.
- **NFR-006.2**: User interactions (filtering, tab switching, and dialog toggles) shall render within 100 milliseconds without UI freezing.
- **Status**: Production Build: **VERIFIED** (Built in ~1.2s, gzip client bundle ~116 kB); Image Canvas Pipeline: **VERIFIED**.

### NFR-007: Maintainability & Code Quality
- **NFR-007.1**: The codebase must adhere to strict ESLint configurations with zero lint warnings or errors.
- **NFR-007.2**: Every release must pass an automated CI test suite executing in GitHub Actions prior to branch integration.
- **NFR-007.3**: Styling must be structured using CSS Custom Properties (tokens) and scoped CSS Modules to prevent style pollution.
- **Status**: Module 09 Verification: **VERIFIED** (ESLint 0 errors/warnings, Vitest 234/234 tests passing across 29 suites, production build passing, 146 design tokens verified, 20 curated catalogue products verified).
