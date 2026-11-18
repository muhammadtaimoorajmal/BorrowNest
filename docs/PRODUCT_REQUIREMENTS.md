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
| **FR-001** | Item Listing Creation | The owner can add an item with a genuine title, category, description, authentic photos, and condition rating. | Module 03 | **PLANNED** |
| **FR-002** | Item Discovery | The borrower can browse all active and available items saved within the local library. | Module 04 | **PLANNED** |
| **FR-003** | Search and Filtering | Users can filter items by search keywords, category tags, and lending availability status. | Module 04 | **PLANNED** |
| **FR-004** | Item Detail Inspection | The borrower can review full item details, usage guidelines, general pickup area, and owner condition notes. | Module 04 | **PLANNED** |
| **FR-005** | Borrowing Request Submission | A borrower can submit a request specifying the desired borrowing timeframe and a short note. | Module 05 | **PLANNED** |
| **FR-006** | Request Decision Workflow | The item owner can review pending borrowing requests and choose to approve or decline them. | Module 05 | **PLANNED** |
| **FR-007** | Borrowing Period Scheduling | The system records explicit start and return dates, preventing conflicting overlapping bookings. | Module 05 | **PLANNED** |
| **FR-008** | Collection & Return Logging | Both parties can track handover confirmation, active loan duration, and return completion. | Module 06 | **PLANNED** |
| **FR-009** | Item Condition Recording | Users can record item condition and observations prior to collection and re-inspect condition upon return. | Module 06 | **PLANNED** |
| **FR-010** | Borrowing History & Status | Users can view past completed loans, active borrowings, and upcoming return deadlines in one place. | Module 06 | **PLANNED** |

---

## 2. Non-Functional Requirements (NFR)

### NFR-001: Usability & Interaction
- **NFR-001.1**: The user interface shall provide clear feedback for empty states, form validations, and status transitions without requiring technical knowledge.
- **NFR-001.2**: Critical workflows (such as creating a listing or approving a request) shall require no more than three simple interaction steps.
- **Status**: Foundation Shell: **VERIFIED**; Future Forms: **PLANNED**.

### NFR-002: Accessibility (a11y)
- **NFR-002.1**: Target compliance is **WCAG 2.2 Level AA**.
- **NFR-002.2**: All interactive components must be navigable and operable using standard keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`).
- **NFR-002.3**: High contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components) must be maintained across all color tokens.
- **NFR-002.4**: Semantic HTML landmarks (`banner`, `main`, `contentinfo`, `section`) and ARIA labels must be properly structured.
- **Status**: Foundation Shell: **VERIFIED**; Full Application: **PLANNED**.

### NFR-003: Responsiveness & Mobile Ergonomics
- **NFR-003.1**: The application layout shall seamlessly adapt across mobile devices (320px+), tablets (768px+), and desktop screens (1024px+).
- **NFR-003.2**: Touch target sizes for primary buttons and interactive elements shall meet or exceed 44×44 CSS pixels.
- **Status**: Foundation Shell: **VERIFIED**; Full Application: **PLANNED**.

### NFR-004: Data Privacy & Security
- **NFR-004.1**: Private collection instructions (such as exact home street address) must remain hidden from view until a loan request is explicitly approved by the owner.
- **NFR-004.2**: No user data, telemetry, or listing details shall be sent to external servers or third-party tracking services.
- **NFR-004.3**: All storage operations must occur strictly client-side using browser-managed secure storage APIs.
- **Status**: Architecture Policy: **VERIFIED**; Implementation: **PLANNED**.

### NFR-005: Reliability & Data Integrity
- **NFR-005.1**: The system must never auto-generate fake listings, synthetic accounts, or fictitious transactions.
- **NFR-005.2**: State changes (such as approval, cancellation, and return) must be deterministic and prevent invalid state transitions.
- **Status**: Policy & Shell: **VERIFIED**; Storage Engine: **PLANNED**.

### NFR-006: Performance
- **NFR-006.1**: Initial client bundle load time must be under 1.5 seconds on a standard 3G/4G network.
- **NFR-006.2**: User interactions (filtering, tab switching, and dialog toggles) shall render within 100 milliseconds without UI freezing.
- **Status**: Production Build: **VERIFIED** (Built in < 200ms, client bundle ~230 kB uncompressed / 73 kB gzip); Runtime: **PLANNED**.

### NFR-007: Maintainability & Code Quality
- **NFR-007.1**: The codebase must adhere to strict ESLint configurations with zero lint warnings or errors.
- **NFR-007.2**: Every release must pass an automated CI test suite executing in GitHub Actions prior to branch integration.
- **NFR-007.3**: Styling must be structured using CSS Custom Properties (tokens) and scoped CSS Modules to prevent style pollution.
- **Status**: Module 01 Foundation: **VERIFIED**.
