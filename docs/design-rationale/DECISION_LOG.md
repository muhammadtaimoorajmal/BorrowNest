# BorrowNest — Authoritative Decision Log

This log maintains the authoritative registry of all formal architectural and HCI design decisions established for BorrowNest.

---

## Summary Decision Register

| ID | Title & Question | Selected Option | Score | Status | Module |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **[DR-01](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-01_ITEM_DISCOVERY.md)** | Item Discovery & Search Structure | **Option C: Unified Discovery** | **90.0** | **DECIDED** | Module 04 |
| **[DR-02](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-02_BORROWING_APPROVAL.md)** | Borrowing Request & Approval Workflow | **Option C: Structured Borrowing Request** | **90.0** | **DECIDED** | Module 05 |
| **[DR-03](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-03_AVAILABILITY_SCHEDULING.md)** | Availability & Date-Range Scheduling | **Option B: Explicit Date-Range Scheduling** | **86.0** | **DECIDED** | Module 05 |
| **[DR-04](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-04_CONDITION_HANDOVER.md)** | Item Condition & Handover Documentation | **Option C: Structured Condition Checkpoints** | **84.0** | **DECIDED** | Module 06 |
| **[DR-05](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-05_LOCATION_PRIVACY.md)** | Location Privacy & Disclosure | **Option C: Coarse Area Only (Local-First)** | **92.0** | **DECIDED** | Module 03 |
| **[DR-06](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-06_RESPONSIVE_NAVIGATION.md)** | Responsive Navigation & Perspective Structure | **Option C: Task-Oriented Sections** | **89.0** | **DECIDED** | Module 03 |

---

## Detailed Decision Records

### DR-01: Item Discovery and Search Structure
- **Design Question**: How should users discover, browse, and search genuine available items without unnecessary cognitive effort?
- **Selected Option**: **Option C — Unified Discovery** (Persistent search bar, category filter pills, availability toggles, active filter tags, and clear zero-match recovery).
- **Weighted Score**: **90.0 / 100**
- **Main Rationale**: Simultaneously satisfies specific keyword searches and exploratory browsing, maximizes recognition over recall, and provides robust zero-state recovery.
- **Requirements Affected**: FR-002, FR-003, FR-004, NFR-001, NFR-002.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #6, #7, #9), E-03 (WCAG 2.2 SC 3.3.2), E-04 (Form Labels).
- **Decision Status**: **DECIDED**.
- **Target Implementation Module**: Module 04 (Discovery and Search).
- **Known Limitation**: Text filtering relies on exact substring matching rather than fuzzy phonetic search.

---

### DR-02: Borrowing Request and Owner Approval Workflow
- **Design Question**: How should a borrower propose a borrowing arrangement and how should the item owner make a decision?
- **Selected Option**: **Option C — Structured Borrowing Request** (Explicit date range, borrower note, deterministic `PENDING` state, owner `APPROVE` / `DECLINE`, and borrower `CANCEL`).
- **Weighted Score**: **90.0 / 100**
- **Main Rationale**: Protects owner consent and scheduling control, provides unambiguous status visibility, and enforces state integrity.
- **Requirements Affected**: FR-005, FR-006, FR-007, NFR-001, NFR-005.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #1, #3, #5), E-05 (Form Instructions).
- **Decision Status**: **DECIDED**.
- **Target Implementation Module**: Module 05 (Borrowing Flow).
- **Known Limitation**: Operates within local client runtime; does not trigger external push notifications to other devices.

---

### DR-03: Borrowing Availability and Scheduling
- **Design Question**: How should availability and requested loan periods be represented so that users understand when an item can be borrowed and double-bookings are prevented?
- **Selected Option**: **Option B — Explicit Date-Range Scheduling** (Start date and return deadline with deterministic inclusive interval overlap validation: `candidateStart <= existingReturn AND existingStart <= candidateReturn`).
- **Weighted Score**: **86.0 / 100**
- **Main Rationale**: Mathematically eliminates overlapping double bookings using accessible HTML date controls without heavy third-party calendar libraries.
- **Requirements Affected**: FR-007, FR-008, FR-010, NFR-001, NFR-005.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #5, #9), E-03 (WCAG 2.2 SC 3.3.1, 3.3.2), E-05 (Form Instructions).
- **Decision Status**: **DECIDED**.
- **Target Implementation Module**: Module 05 (Borrowing Flow & Scheduling).
- **Known Limitation**: Operates on full-day boundaries without sub-day hourly time slots.

---

### DR-04: Item Condition and Handover Documentation
- **Design Question**: How should item condition be recorded before, during, and after borrowing to reduce misunderstandings without creating excessive interaction burden?
- **Selected Option**: **Option C — Structured Condition Checkpoints** (Standardized 5-tier grades captured at listing, confirmed at collection handoff, and re-inspected upon return, supported by optional user photos and comparison views).
- **Weighted Score**: **84.0 / 100**
- **Main Rationale**: Provides end-to-end condition traceability, establishes baseline accountability, and protects both parties without onerous bureaucratic checklists.
- **Requirements Affected**: FR-008, FR-009, NFR-004, NFR-005.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #2, #5, #8), E-03 (WCAG 2.2 SC 3.3.2).
- **Decision Status**: **DECIDED**.
- **Target Implementation Module**: Module 06 (Inspection & Returns).
- **Known Limitation**: Condition logs are transparent informational records; they do not constitute legally binding contracts or automated liability determinations.

---

### DR-05: Collection Location Privacy and Disclosure
- **Design Question**: How should BorrowNest communicate collection proximity while minimizing exposure of sensitive residential information?
- **Selected Option**: **Option C — Coarse Area Only in Current Prototype** (Display coarse neighborhood/district name; strictly avoid collecting or storing exact residential addresses in the local-first prototype).
- **Weighted Score**: **92.0 / 100**
- **Main Rationale**: Eliminates pseudo-security claims; data that is never collected cannot be leaked. Provides sufficient proximity context for borrowers while keeping homeowner locations private.
- **Requirements Affected**: FR-004, FR-008, NFR-004, NFR-005.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #2, #8), Privacy by Design Principles.
- **Decision Status**: **DECIDED** (Corrects Module 01 preliminary notes).
- **Target Implementation Module**: Module 03 (Item Listing Creation) and Module 04 (Discovery).
- **Known Limitation**: Parties in a future real deployment must coordinate precise final pickup spots externally or via future authenticated backend modules.

---

### DR-06: Responsive Navigation and Borrower/Owner Interaction Structure
- **Design Question**: How should the application organize borrowing and lending activities so that an individual can comfortably perform both types of tasks on desktop and mobile devices?
- **Selected Option**: **Option C — Unified Application with Task-Oriented Sections** (Cohesive four-section shell: *Discover*, *Borrowing*, *Lending*, *Account*, with responsive desktop header and mobile bottom navigation).
- **Weighted Score**: **89.0 / 100**
- **Main Rationale**: Eliminates mode confusion, reflects the real-world fluidity of peer lending, and delivers superior mobile touch ergonomics with 44×44px targets.
- **Requirements Affected**: FR-001 through FR-010, NFR-001, NFR-002, NFR-003.
- **Evidence References**: E-01 (QOC), E-02 (NN/g Heuristics #4, #6, #7), E-03 (WCAG 2.2 SC 2.5.8, SC 2.5.5).
- **Decision Status**: **DECIDED**.
- **Target Implementation Module**: Module 03 (App Shell & UI Foundations).
- **Known Limitation**: Borrower and Owner are task perspectives, not authenticated multi-user roles.
