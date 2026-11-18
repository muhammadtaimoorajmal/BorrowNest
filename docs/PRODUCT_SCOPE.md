# BorrowNest — Product Scope

This document delineates the functional scope, perspectives, architectural boundaries, and deliberate non-goals of the BorrowNest platform.

---

## 1. Core In-Scope Capabilities

The full planned capabilities of BorrowNest comprise six foundational modules:

### A. Item Discovery
- **Listing Exploration**: Browse genuine locally stored item records.
- **Search Capabilities**: Find items by title, tags, and descriptive keywords.
- **Categorization & Filtering**: Filter items by category (e.g., Tools, Gardening, Household, Outdoor, Electronics) and current lending availability.
- **Detailed Item Inspection**: View genuine owner-provided photos, operating notes, item condition ratings, and approximate collection zones.

### B. Item Management (Lender / Owner)
- **Listing Creation**: Add new items with title, description, category, condition rating, and authentic photographs.
- **Listing Modification**: Edit item descriptions, maintenance notes, and usage guidelines.
- **Availability Controls**: Mark items as available, temporarily paused, on loan, or archived.
- **Listing Archival**: Safely archive retired items while preserving historical loan records.

### C. Borrowing Workflow
- **Request Submission**: Submit a structured borrowing request specifying collection date, return deadline, borrower display alias, and intended usage notes (**IMPLEMENTED — Module 05**).
- **Duration Agreement**: Provide unambiguous calendar date ranges with inclusive conflict prevention (**IMPLEMENTED — Module 05**).
- **Owner Governance**: Empower item owners to review, approve, or decline pending requests with transactional atomic conflict verification (**IMPLEMENTED — Module 05**).
- **Status Progression**: Track request lifecycle from `PENDING` $\rightarrow$ `APPROVED` | `DECLINED` | `CANCELLED` (**IMPLEMENTED — Module 05**). Physical collection handoff and return condition inspection implemented in Module 06.
- **Physical Custody Decoupling**: Separate immutable request decisions from physical custody state machine (`RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`) (**IMPLEMENTED — Module 06**).

### D. Condition Management (DR-04)
- **Condition Rating**: Rate condition across standard 5 tiers (Like New, Good, Fair, Poor, Not Functional) (**IMPLEMENTED — Module 03 & Module 06**).
- **Descriptive Observations**: Document pre-existing marks, scratches, or handling quirks prior to lending (**IMPLEMENTED — Module 03 & Module 06**).
- **Handover & Return Checkpoints**: Two-party verification at physical handoff (owner record, borrower confirmation) and return (borrower return marking, owner condition inspection) (**IMPLEMENTED — Module 06**).
- **Side-by-Side Condition Comparison**: Objective comparison across Listing Baseline, Collection Handover, and Return Inspection with change summary pills and transparency disclaimers (**IMPLEMENTED — Module 06**).

### E. Privacy Architecture (DR-05 Resolution)
- **Coarse Neighborhood Disclosure**: Listings collect and display only general neighborhood, district, or public landmark areas (e.g., "Oakwood / Near Central Park").
- **Zero Exact Address Storage in Local Prototype**: Exact residential street addresses, apartment unit numbers, and private access codes are explicitly **not collected or stored** in the local-first prototype, establishing an architecturally honest privacy boundary.
- **Future Post-Approval Disclosure**: Two-tier private disclosure is a planned capability requiring authenticated user identities, server-side authorization controls, and secure cloud storage in future enterprise releases.
- **Data Minimization**: Collect only essential fields; avoid telephone numbers, social links, or invasive identity identifiers.

### F. Activity & Schedule Management
- **Active Loans Dashboard**: Immediate visibility into items currently borrowed and items lent out with dedicated "Items Lent Out" workspace tab (**IMPLEMENTED — Module 06**).
- **Schedule Awareness**: Highlighting upcoming due dates, due-today notices, uncollected reservation alerts, and derived overdue active loan warnings (**IMPLEMENTED — Module 05 & Module 06**).
- **Historical Records**: Log of completed borrowing cycles, released reservations, and inspection history preserved in IndexedDB (**IMPLEMENTED — Module 06**).

---

## 2. Explicitly Excluded Capabilities (Non-Goals)

To preserve data privacy, operational simplicity, and architectural focus, the following capabilities are explicitly out of scope for the current local-first architecture:

1. **Monetary Transactions & Payments**: BorrowNest is designed for peer lending and mutual aid. It does not process payments, rental deposits, or banking transactions.
2. **Third-Party Identity Verification**: No credit checks, governmental ID scanning, or external KYC verification.
3. **Public Social Network Feeds**: No public comments, vanity follower counts, algorithmic recommendations, or social chatter.
4. **Third-Party Telemetry & Surveillance**: Zero commercial advertising trackers, cross-site cookies, or behavioral analytics.
5. **Real-Time GPS Tracking**: No live geofencing or continuous device location monitoring.
6. **Insecure Pseudo-Authentication**: We do not implement fake, vulnerable mock login forms that pretend to be secure enterprise identity providers.

---

## 3. User Perspectives (Functional Task Views)

*(Note: In accordance with DR-06, Borrower and Lender/Owner represent functional task perspectives within a unified application shell, not separate authenticated user roles. No verified empirical personas are claimed.)*

### The Borrower Perspective (Task View)
- Needs to know what tools or items are currently accessible nearby via coarse neighborhood tags.
- Needs clarity on the owner's availability rules and return expectations.
- Wants prompt feedback on whether a request has been accepted.
- Values documented pre-existing item condition to prevent unfair disputes upon return.

### The Lender / Owner Perspective (Task View)
- Retains complete control over who borrows their property and for what duration.
- Safeguards residential privacy by avoiding the collection or public disclosure of exact street addresses.
- Requires visibility into who possesses which item and when it will be returned.
- Wants a lightweight method to log item condition before handoff and after return.

---

## 4. Current Local-First Boundaries & Module 06 Status

The Module 06 implementation delivers complete physical handover logging, borrower receipt confirmation, return verification, standardized condition inspection (DR-04), and side-by-side condition comparison alongside the full BorrowNest application lifecycle and IndexedDB version 3 persistence. Evaluators and users should recognize the following implemented capabilities:

- **Decoupled Physical Custody Lifecycle**: Request decision states (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`) remain immutable records. Physical custody lifecycle progresses separately in the `loans` store: `RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`.
- **Collection Handover Protocol**: Owner records initial condition checkpoint (1–5 tier, observations, max 5 sanitized photos); borrower physically inspects the item and confirms receipt, transitioning the loan to `ACTIVE`.
- **Return Verification & Inspection Protocol**: Borrower marks the item physically returned; owner conducts a standardized return condition inspection (1–5 tier, observations, photos) and closes the loan to `COMPLETED`, setting `completedAt`.
- **Structured Condition Comparison View (DR-04 Option C)**: Side-by-side 3-column evaluation (Listing Baseline vs. Collection Handover vs. Return Inspection) with change summary transition pills and explicit transparency notices.
- **Uncollected Reservation Release**: Explicit owner resolution for reservations whose pickup window elapsed without physical collection (`RELEASED_NOT_COLLECTED`), safely unlocking calendar dates without deleting history.
- **Derived Overdue State**: Overdue is strictly a derived display state for active physical loans past return deadline (`loan.status === 'ACTIVE' && loan.returnDeadline < today`).
- **Relational Integrity Guards**: Deleting items with request or loan history remains permanently blocked (`ItemHasRequestHistoryError`). Archiving items is blocked while loans are in `RESERVED` or `ACTIVE`, but is permitted when all associated loans are `COMPLETED` or `RELEASED_NOT_COLLECTED`.
- **IndexedDB Schema Version 3 & Multi-Store Backup Version 3**: Native `loans` store with indexes, non-destructive migration backfilling legacy `APPROVED` requests as `RESERVED` loans, and version 3 backup/restore serializing items, photos, borrowing requests, and loan lifecycles with checkpoint photographs. All multi-store operations execute atomically.
- **Honest Local-First Disclosures**: Clear statements that condition checkpoints are informational peer observations (not legal findings or insurance appraisals) and confirmations are local acknowledgements (not digital signatures or remote notifications).

---

## 5. Future Extension Boundaries

Future iterations may explore:
- Peer-to-peer or local network synchronization (e.g., WebRTC or encrypted export/import bundles).
- Calendar file exports (`.ics`) for return reminders.
- Progressive Web App (PWA) offline caching and installation.
