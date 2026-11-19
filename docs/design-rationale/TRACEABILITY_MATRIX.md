# BorrowNest — Requirements and Design Traceability Matrix

This matrix establishes bidirectional traceability between architectural decisions, core design questions, chosen solutions, evaluative criteria, authoritative evidence, and product requirements.

---

## Traceability Register

| Decision ID | Design Question | Selected Option | Key Criteria | Authoritative Evidence | Affected FRs | Affected NFRs | Target Module |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **[DR-01](./DR-01_ITEM_DISCOVERY.md)** | How to discover, browse, and search items without unnecessary cognitive effort? | **Option C: Unified Discovery** | • Discoverability (25%)<br>• Cognitive Effort (25%)<br>• Feedback Clarity (20%)<br>• Accessibility (20%)<br>• Simplicity (10%) | • E-01 (QOC)<br>• E-02 (Heuristics #6, #7, #9)<br>• E-03 (WCAG SC 3.3.2)<br>• E-04 (Form Labels) | **FR-002** (Discovery)<br>**FR-003** (Search/Filter)<br>**FR-004** (Detail Inspection) | **NFR-001** (Usability)<br>**NFR-002** (Accessibility) | **Module 04** (Discovery & Search) |
| **[DR-02](./DR-02_BORROWING_APPROVAL.md)** | How to propose a borrowing loan and make an owner decision? | **Option C: Structured Borrowing Request** | • Owner Control (25%)<br>• Status Clarity (25%)<br>• Error Prevention (20%)<br>• Efficiency (15%)<br>• Local Feasibility (15%) | • E-01 (QOC)<br>• E-02 (Heuristics #1, #3, #5)<br>• E-05 (Form Instructions) | **FR-005** (Request Submission)<br>**FR-006** (Owner Decision)<br>**FR-007** (Period Scheduling) | **NFR-001** (Usability)<br>**NFR-005** (Reliability) | **Module 05** (Borrowing Flow) |
| **[DR-03](./DR-03_AVAILABILITY_SCHEDULING.md)** | How to represent availability and prevent double-booking overlaps? | **Option B: Explicit Date-Range Scheduling** | • Conflict Prevention (30%)<br>• Comprehension (20%)<br>• Flexibility (15%)<br>• Accessibility (15%)<br>• Simplicity (20%) | • E-01 (QOC)<br>• E-02 (Heuristics #5, #9)<br>• E-03 (WCAG SC 3.3.1, 3.3.2)<br>• E-05 (Form Instructions) | **FR-007** (Period Scheduling)<br>**FR-008** (Handoff Logging)<br>**FR-010** (Loan History) | **NFR-001** (Usability)<br>**NFR-005** (Reliability) | **Module 05** (Borrowing Flow & Scheduling) |
| **[DR-04](./DR-04_CONDITION_HANDOVER.md)** | How to record item condition before, during, and after borrowing? | **Option C: Structured Condition Checkpoints** | • Traceability (25%)<br>• Ease & Speed (20%)<br>• Evidence Quality (15%)<br>• Privacy & a11y (20%)<br>• Local Feasibility (20%) | • E-01 (QOC)<br>• E-02 (Heuristics #2, #5, #8)<br>• E-03 (WCAG SC 3.3.2) | **FR-008** (Handoff Logging)<br>**FR-009** (Condition Record) | **NFR-004** (Privacy)<br>**NFR-005** (Reliability) | **Module 06** (Inspection & Returns) |
| **[DR-05](./DR-05_LOCATION_PRIVACY.md)** | How to communicate pickup proximity while minimizing address exposure? | **Option C: Coarse Area Only (Local-First)** | • Data Minimization (35%)<br>• Pre-Request Context (15%)<br>• Honest Security (25%)<br>• User Control (15%)<br>• Low Friction (10%) | • E-01 (QOC)<br>• E-02 (Heuristics #2, #8)<br>• Privacy by Design | **FR-004** (Detail Inspection)<br>**FR-008** (Handoff Logging) | **NFR-004** (Privacy)<br>**NFR-005** (Reliability) | **Module 03** (Item Management)<br>**Module 04** (Discovery) |
| **[DR-06](./DR-06_RESPONSIVE_NAVIGATION.md)** | How to organize borrower and lender tasks comfortably across devices? | **Option C: Task-Oriented Sections** | • Mental Model (25%)<br>• Efficiency (20%)<br>• Mobile Ergonomics (20%)<br>• Accessibility (20%)<br>• Simplicity (15%) | • E-01 (QOC)<br>• E-02 (Heuristics #4, #6, #7)<br>• E-03 (WCAG SC 2.5.8, SC 2.5.5) | **FR-001** through **FR-010** | **NFR-001** (Usability)<br>**NFR-002** (Accessibility)<br>**NFR-003** (Responsiveness) | **Module 03** (App Shell & Navigation) |

---

## Status Classification Audit

| Requirement ID | Name | Architectural Design Status | Implementation Status | Verification Status |
| :---: | :--- | :---: | :---: | :---: |
| **FR-001** | Item Listing Creation | **DECIDED (DR-04, DR-05, DR-06)** | IMPLEMENTED (Module 03) | VERIFIED (Vitest & CI) |
| **FR-002** | Item Discovery | **DECIDED (DR-01, DR-06)** | IMPLEMENTED (Module 04) | VERIFIED (Vitest & CI) |
| **FR-003** | Search and Filtering | **DECIDED (DR-01)** | IMPLEMENTED (Module 04) | VERIFIED (Vitest & CI) |
| **FR-004** | Item Detail Inspection | **DECIDED (DR-01, DR-05)** | IMPLEMENTED (Module 04) | VERIFIED (Vitest & CI) |
| **FR-005** | Borrowing Request Submission | **DECIDED (DR-02, DR-03)** | IMPLEMENTED (Module 05) | VERIFIED (Vitest & CI) |
| **FR-006** | Request Decision Workflow | **DECIDED (DR-02)** | IMPLEMENTED (Module 05) | VERIFIED (Vitest & CI) |
| **FR-007** | Borrowing Period Scheduling | **DECIDED (DR-02, DR-03)** | IMPLEMENTED (Module 05) | VERIFIED (Vitest & CI) |
| **FR-008** | Collection & Return Logging | **DECIDED (DR-03, DR-04, DR-05)** | IMPLEMENTED (Module 06) | VERIFIED (Vitest & CI) |
| **FR-009** | Item Condition Recording | **DECIDED (DR-04)** | IMPLEMENTED (Module 06) | VERIFIED (Vitest & CI) |
| **FR-010** | Borrowing History & Status | **DECIDED (DR-03, DR-06)** | IMPLEMENTED (Module 06) | VERIFIED (Vitest & CI) |
| **NFR-001** | Usability & Interaction | **DECIDED (DR-01, 02, 03, 06)** | Implemented & Verified | VERIFIED (Modules 01–06) |
| **NFR-002** | Accessibility (WCAG 2.2 AA) | **DECIDED (DR-01, 06)** | Implemented & Verified | VERIFIED (Modules 01–06) |
| **NFR-003** | Responsiveness & Mobile Ergonomics | **DECIDED (DR-06)** | Implemented & Verified | VERIFIED (48px Touch Targets) |
| **NFR-004** | Data Privacy & Security | **DECIDED (DR-04, DR-05)** | Implemented & Verified | VERIFIED (Canvas EXIF & Address Guard) |
| **NFR-005** | Reliability & Data Integrity | **DECIDED (DR-02, 03, 04, 05)** | Implemented & Verified | VERIFIED (Zero-Fake-Data & DB v3) |
| **NFR-006** | Performance | **DECIDED (DR-01, 03)** | Implemented & Verified | VERIFIED (Build ~1.2s, Bundle ~116 kB gzip) |
| **NFR-007** | Maintainability & Quality | **DECIDED (DR-01 through 06)** | CI Automated | VERIFIED (0 lint, 241 tests passing across 30 test suites) |
