# BorrowNest — Design Decision Areas (Module 02 Pre-Registration)

This document pre-registers the six core architectural and HCI decision areas scheduled for formal Question-Option-Criteria (QOC) analysis in Module 02.

In accordance with Module 01 guidelines:
- The design questions, rationale, and affected feature scope are identified below.
- **No final design decisions, option evaluation matrices, synthetic criteria scores, or prefabricated resolutions are recorded in Module 01.**
- All decision areas maintain the status: **PENDING QOC ANALYSIS**.

---

## Decision Area DR-01: Item Discovery and Search Structure

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: How should available items be organized, browsed, and searched within a local-first catalog to optimize discoverability without cognitive overload?
- **Why It Matters**: In peer item sharing, users search either with a specific tool in mind (e.g., "rotary hammer drill") or by general task category (e.g., "lawn care"). The navigation and filtering structure directly determines how fast a borrower can locate suitable equipment and evaluate its availability.
- **Features Affected**:
  - FR-002: Item Discovery
  - FR-003: Search and Filtering
  - FR-004: Item Detail Inspection

---

## Decision Area DR-02: Borrowing Request and Owner Approval Workflow

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: What interaction model should govern how borrowers propose loans and how owners review, negotiate, and approve or decline borrowing requests?
- **Why It Matters**: Peer lending depends entirely on owner confidence and clear mutual consent. If the approval workflow is too rigid, simple peer loans become cumbersome; if it is too unstructured, owners feel pressured or uncertain about borrower intentions and usage expectations.
- **Features Affected**:
  - FR-005: Borrowing Request Submission
  - FR-006: Request Decision Workflow
  - NFR-001: Usability & Interaction

---

## Decision Area DR-03: Borrowing Availability and Scheduling

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: How should item availability dates, loan timeframes, and overlapping borrowing requests be visualized, scheduled, and validated?
- **Why It Matters**: Double-booking an item or having ambiguous return deadlines causes interpersonal friction and coordination breakdowns. The scheduling interface must clearly convey calendar availability, active loans, and buffer periods for returns without overcomplicating data entry.
- **Features Affected**:
  - FR-007: Borrowing Period Scheduling
  - FR-008: Collection and Return Logging
  - FR-010: Borrowing History & Status

---

## Decision Area DR-04: Item Condition and Handover Documentation

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: What structure and protocol should be used to capture, verify, and compare item condition at the moments of collection and return?
- **Why It Matters**: Disagreements regarding tool wear, preexisting scratches, or post-loan damage are major impediments to community item sharing. A reliable, lightweight condition-recording mechanism protects both the lender and borrower without creating onerous administrative friction.
- **Features Affected**:
  - FR-009: Item Condition Recording
  - FR-008: Collection and Return Logging
  - NFR-005: Reliability & Data Integrity

---

## Decision Area DR-05: Collection-Location Privacy and Disclosure

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: How should collection points and handoff instructions be structured and progressively disclosed across the discovery and approved loan stages?
- **Why It Matters**: Displaying exact residential addresses publicly compromises homeowner safety and privacy. Conversely, disclosing zero geographical context prevents borrowers from knowing whether an item is reasonably close enough to collect.
- **Features Affected**:
  - FR-004: Item Detail Inspection
  - FR-008: Collection and Return Logging
  - NFR-004: Data Privacy & Security

---

## Decision Area DR-06: Responsive Navigation and Borrower/Owner Interaction Structure

- **Status**: **PENDING QOC ANALYSIS**
- **Design Question**: How should the application interface structure navigation between the Borrower perspective (discovering and requesting items) and the Owner perspective (managing items and approving requests) across desktop and mobile form factors?
- **Why It Matters**: In peer-to-peer sharing, an individual user frequently acts as both a borrower of others' goods and a lender of their own. The navigation architecture must make role switching intuitive while maintaining a cohesive, uncluttered mental model on small mobile screens and large displays alike.
- **Features Affected**:
  - NFR-001: Usability & Interaction
  - NFR-003: Responsiveness & Mobile Ergonomics
  - All functional modules (FR-001 through FR-010)
