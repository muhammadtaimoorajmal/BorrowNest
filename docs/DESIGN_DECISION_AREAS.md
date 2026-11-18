# BorrowNest — Design Decision Areas (Module 02 Resolutions)

This document records the formal resolutions of the six core architectural and HCI design decision areas for BorrowNest. Each decision was evaluated using the Question-Option-Criteria (QOC) framework and is documented in an authoritative standalone analysis file in [`docs/design-rationale/`](design-rationale/).

---

## Decision Area DR-01: Item Discovery and Search Structure

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option C — Unified Discovery** (Weighted Score: **90.0 / 100**)
- **Design Question**: How should users discover, browse, and search genuine available items without unnecessary cognitive effort?
- **Summary Resolution**: Unified interface combining a prominent persistent search bar with visible category filter pills (*All*, *Tools*, *Gardening*, *Household*, *Outdoor*, *Electronics*), an availability checkbox toggle, dynamic active filter indicators, and a one-click filter reset control.
- **Detailed Analysis**: [DR-01_ITEM_DISCOVERY.md](design-rationale/DR-01_ITEM_DISCOVERY.md)
- **Features Affected**: FR-002, FR-003, FR-004, NFR-001, NFR-002.
- **Target Implementation**: Module 04.

---

## Decision Area DR-02: Borrowing Request and Owner Approval Workflow

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option C — Structured Borrowing Request** (Weighted Score: **90.0 / 100**)
- **Design Question**: How should a borrower propose a borrowing arrangement and how should the item owner make a decision?
- **Summary Resolution**: Structured request workflow where the borrower specifies start and return dates and an optional note. The request enters a visible `PENDING` state. The owner can explicitly **Approve** or **Decline**. The borrower can **Cancel** an unapproved pending request. Actions on finalized requests are disallowed.
- **Local-First Boundary**: Represents an internal client state machine; does not transmit push notifications to external devices.
- **Detailed Analysis**: [DR-02_BORROWING_APPROVAL.md](design-rationale/DR-02_BORROWING_APPROVAL.md)
- **Features Affected**: FR-005, FR-006, FR-007, NFR-001, NFR-005.
- **Target Implementation**: Module 05.

---

## Decision Area DR-03: Borrowing Availability and Scheduling

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option B — Explicit Date-Range Scheduling** (Weighted Score: **86.0 / 100**)
- **Design Question**: How should item availability dates, loan timeframes, and overlapping borrowing requests be visualized, scheduled, and validated?
- **Summary Resolution**: Explicit Collection Date and Return Deadline inputs validated via an inclusive interval overlap check: `candidateStart <= existingReturn AND existingStart <= candidateReturn`. Pending requests do not lock the calendar; overlap checks re-execute at approval time to prevent race conditions.
- **Detailed Analysis**: [DR-03_AVAILABILITY_SCHEDULING.md](design-rationale/DR-03_AVAILABILITY_SCHEDULING.md)
- **Features Affected**: FR-007, FR-008, FR-010, NFR-001, NFR-005.
- **Target Implementation**: Module 05.

---

## Decision Area DR-04: Item Condition and Handover Documentation

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option C — Structured Condition Checkpoints** (Weighted Score: **84.0 / 100**)
- **Design Question**: What structure and protocol should be used to capture, verify, and compare item condition at the moments of collection and return?
- **Summary Resolution**: Standardized 5-tier condition classification (`Like New`, `Good`, `Fair`, `Poor`, `Not Functional`) recorded at listing baseline, confirmed at collection handoff, and re-inspected at return. Supported by optional authentic user photos with client-side EXIF GPS stripping and a side-by-side comparison view.
- **Legal Distinction**: Condition logs are transparent informational records; they do not constitute legally binding contracts or automated liability determinations.
- **Detailed Analysis**: [DR-04_CONDITION_HANDOVER.md](design-rationale/DR-04_CONDITION_HANDOVER.md)
- **Features Affected**: FR-008, FR-009, NFR-004, NFR-005.
- **Target Implementation**: Module 06.

---

## Decision Area DR-05: Collection-Location Privacy and Disclosure

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option C — Coarse Area Only in Current Prototype** (Weighted Score: **92.0 / 100**)
- **Design Question**: How should collection points and handoff instructions be structured and progressively disclosed across the discovery and approved loan stages?
- **Summary Resolution**: Collect and display only a coarse, user-defined neighborhood or public landmark area (e.g., "North District"). Exact residential street addresses, apartment unit numbers, and private access codes are **not** collected or stored in the local-first prototype.
- **Architectural Honesty**: Corrects preliminary Module 01 notes. Client-side UI toggles do not constitute an authorization boundary; what is never collected cannot be leaked.
- **Detailed Analysis**: [DR-05_LOCATION_PRIVACY.md](design-rationale/DR-05_LOCATION_PRIVACY.md)
- **Features Affected**: FR-004, FR-008, NFR-004, NFR-005.
- **Target Implementation**: Module 03 and Module 04.

---

## Decision Area DR-06: Responsive Navigation and Borrower/Owner Interaction Structure

- **Status**: **DECIDED (Module 02)**
- **Selected Option**: **Option C — Unified Application with Task-Oriented Sections** (Weighted Score: **89.0 / 100**)
- **Design Question**: How should the application interface structure navigation between the Borrower perspective (discovering and requesting items) and the Owner perspective (managing items and approving requests) across desktop and mobile form factors?
- **Summary Resolution**: Cohesive application shell with four primary task destinations (*Discover*, *Borrowing*, *Lending*, *Account*). Responsive desktop sticky top bar and mobile fixed bottom navigation bar with minimum 44×44 CSS pixel touch targets.
- **Role Distinction**: Borrower and Owner are functional task perspectives, not authenticated security roles.
- **Detailed Analysis**: [DR-06_RESPONSIVE_NAVIGATION.md](design-rationale/DR-06_RESPONSIVE_NAVIGATION.md)
- **Features Affected**: FR-001 through FR-010, NFR-001, NFR-002, NFR-003.
- **Target Implementation**: Module 03.
