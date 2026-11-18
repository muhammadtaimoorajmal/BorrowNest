# BorrowNest — Design Rationale & Architectural Decisions (Module 02)

Welcome to the BorrowNest Design Rationale documentation. This directory contains the formal Question-Option-Criteria (QOC) analyses, decision logs, evidence registers, traceability matrices, design blueprints, and technical risk assessments established in Module 02.

---

## 1. Overview of the Design Rationale Suite

Design decisions in BorrowNest are not arbitrary aesthetic choices or ad-hoc technical preferences. They are systematically evaluated using the **Question-Option-Criteria (QOC)** design-space analysis framework developed by MacLean et al. (1991).

This directory comprises the following interconnected documents:

| Document | Purpose |
| :--- | :--- |
| [QOC_METHOD_AND_SCORING.md](./QOC_METHOD_AND_SCORING.md) | Formal methodology, weighted scoring formulas, rating scales, sensitivity analysis rules, and scoring integrity standards. |
| [DECISION_LOG.md](./DECISION_LOG.md) | Authoritative central registry of all six resolved decisions with summary rationales, weighted scores, and target implementation modules. |
| [EVIDENCE_REGISTER.md](./EVIDENCE_REGISTER.md) | Primary reference catalog (E-01 through E-05) of verified HCI theories, Nielsen Norman usability heuristics, and W3C accessibility specifications. |
| [TRACEABILITY_MATRIX.md](./TRACEABILITY_MATRIX.md) | End-to-end traceability mapping each decision to its design question, selected option, criteria, evidence, and affected requirements (FRs/NFRs). |
| [SELECTED_DESIGN_BLUEPRINT.md](./SELECTED_DESIGN_BLUEPRINT.md) | Synthesized, cohesive product blueprint translating the six selected alternatives into concrete interface architectures and workflow state diagrams. |
| [TECHNICAL_RISK_REGISTER.md](./TECHNICAL_RISK_REGISTER.md) | Comprehensive audit of real technical risks, including local-first boundaries, dependency security advisories, runtime deprecations, and privacy constraints. |

---

## 2. The Six Architectural Decisions

Each decision is documented in an exhaustive, standalone analysis file:

1. **[DR-01: Item Discovery and Search Structure](./DR-01_ITEM_DISCOVERY.md)**
   - *Question*: How should users discover, browse, and search genuine available items without unnecessary cognitive effort?
   - *Selected Direction*: **Option C — Unified Discovery** (Visible search field, categorical pills, progressive availability filters, and zero-results recovery).
   - *Weighted Score*: **90.0 / 100**

2. **[DR-02: Borrowing Request and Owner Approval Workflow](./DR-02_BORROWING_APPROVAL.md)**
   - *Question*: How should a borrower propose a borrowing arrangement and how should the item owner make a decision?
   - *Selected Direction*: **Option C — Structured Borrowing Request** (Explicit date range, borrower note, deterministic `PENDING` state, owner `APPROVE` / `DECLINE`, and borrower `CANCEL`).
   - *Weighted Score*: **90.0 / 100**

3. **[DR-03: Borrowing Availability and Scheduling](./DR-03_AVAILABILITY_SCHEDULING.md)**
   - *Question*: How should availability and requested loan periods be represented so that users understand when an item can be borrowed and double-bookings are prevented?
   - *Selected Direction*: **Option B — Explicit Date-Range Scheduling** (Standard start/return dates with deterministic interval overlap validation: `candidateStart <= existingReturn AND existingStart <= candidateReturn`).
   - *Weighted Score*: **86.0 / 100**

4. **[DR-04: Item Condition and Handover Documentation](./DR-04_CONDITION_HANDOVER.md)**
   - *Question*: How should item condition be recorded before, during, and after borrowing to reduce misunderstandings without creating excessive interaction burden?
   - *Selected Direction*: **Option C — Structured Condition Checkpoints** (Standardized condition tiers recorded at listing, confirmed at collection handoff, and verified upon return, supported by optional user photos).
   - *Weighted Score*: **84.0 / 100**

5. **[DR-05: Collection Location Privacy and Disclosure](./DR-05_LOCATION_PRIVACY.md)**
   - *Question*: How should BorrowNest communicate collection proximity while minimizing exposure of sensitive residential information?
   - *Selected Direction*: **Option C — Coarse Area Only in Current Prototype** (Display coarse neighborhood/district name; strictly avoid collecting or storing exact residential addresses in the local-first prototype).
   - *Weighted Score*: **92.0 / 100**

6. **[DR-06: Responsive Navigation and Borrower/Owner Structure](./DR-06_RESPONSIVE_NAVIGATION.md)**
   - *Question*: How should the application organize borrowing and lending activities so that an individual can comfortably perform both types of tasks on desktop and mobile devices?
   - *Selected Direction*: **Option C — Unified Application with Task-Oriented Sections** (Cohesive four-section shell: *Discover*, *Borrowing*, *Lending*, *Account*, with responsive desktop header and mobile bottom navigation).
   - *Weighted Score*: **89.0 / 100**

---

## 3. Analytical Evaluation vs. Empirical User Research

In strict adherence to project integrity:
- **Expert Analytical Assessments**: The numeric ratings and scores herein represent structured expert design evaluations grounded in established HCI literature, heuristic principles, and technical feasibility constraints.
- **No Fabricated User Data**: The project has not conducted empirical usability tests, participant interviews, or field studies. No fictitious user personas, survey statistics, or simulated customer quotes are included.
- **Hypotheses for Validation**: All design decisions are treated as sound architectural baselines and hypotheses to be evaluated in future work against actual user feedback.
