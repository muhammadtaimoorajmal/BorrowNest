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
- **Status Progression**: Track request lifecycle from `PENDING` $\rightarrow$ `APPROVED` | `DECLINED` | `CANCELLED` (**IMPLEMENTED — Module 05**). Physical collection handoff and return condition inspection arrive in Module 06.
- **Overdue Safety Hold**: Approved reservations whose deadline has passed remain locked to prevent conflicting bookings until return completion in Module 06 (**IMPLEMENTED — Module 05**).

### D. Condition Management
- **Condition Rating**: Rate condition across standard tiers (e.g., Brand New, Excellent, Good, Fair).
- **Descriptive Observations**: Document pre-existing marks, scratches, or handling quirks prior to lending.
- **Handover Comparison**: Record observations at return to verify consistent condition and note any maintenance required.

### E. Privacy Architecture (DR-05 Resolution)
- **Coarse Neighborhood Disclosure**: Listings collect and display only general neighborhood, district, or public landmark areas (e.g., "Oakwood / Near Central Park").
- **Zero Exact Address Storage in Local Prototype**: Exact residential street addresses, apartment unit numbers, and private access codes are explicitly **not collected or stored** in the local-first prototype, establishing an architecturally honest privacy boundary.
- **Future Post-Approval Disclosure**: Two-tier private disclosure is a planned capability requiring authenticated user identities, server-side authorization controls, and secure cloud storage in future enterprise releases.
- **Data Minimization**: Collect only essential fields; avoid telephone numbers, social links, or invasive identity identifiers.

### F. Activity & Schedule Management
- **Active Loans Dashboard**: Immediate visibility into items currently borrowed and items lent out.
- **Schedule Awareness**: Highlighting upcoming due dates, due-today notices, and overdue statuses.
- **Historical Records**: Log of completed borrowing cycles for personal reference.

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

## 4. Current Local-First Boundaries & Module 05 Status

The Module 05 implementation delivers complete structured borrowing requests, owner approval workflows, and date-range scheduling alongside unified item discovery, item listing management, and local IndexedDB version 2 persistence. Users and evaluators should recognize the following real constraints and implemented capabilities:

- **Structured Borrowing Requests (DR-02)**: Direct request submission from catalog discovery modal (`BorrowRequestDialog`), recording borrower display alias, collection date, return deadline, and optional intended-use note.
- **Date-Range Scheduling & Conflict Prevention (DR-03)**: Calendar date scheduling with strict inclusive date interval overlap checks (`candidateStart <= existingReturn && existingStart <= candidateReturn`).
- **Atomic Approval Serialization**: Competing approvals are serialized through a single atomic `readwrite` IndexedDB transaction over `[items, borrowingRequests]`, re-verifying conflicts before writing `APPROVED` status.
- **Functional Borrowing Workspace**: Dual-perspective workspace with Borrower View (cancellation of pending requests) and Owner View (approval/decline decisions and active reservation overview).
- **Lending Workspace Integration**: "Incoming Requests" tab displaying pending request counter badges and review decisions.
- **Relational Integrity Safeguards**: Deleting items with request history is blocked (`ItemHasRequestHistoryError`), and archiving items with active approved reservations is blocked (`ItemHasActiveReservationError`).
- **Overdue Safety Hold**: Reservations whose return deadline has passed remain locked, blocking new bookings until physical return in Module 06.
- **Multi-Store Version 2 Backup/Restore**: Version 2 backup schema serializing items, photos, and borrowing requests, with full backward compatibility for version 1 archives.
- **Future Module Boundaries**: Physical collection handover, pre/post-loan condition comparison checklists, and loan completion protocols arrive in Module 06.

---

## 5. Future Extension Boundaries

Future iterations may explore:
- Peer-to-peer or local network synchronization (e.g., WebRTC or encrypted export/import bundles).
- Calendar file exports (`.ics`) for return reminders.
- Progressive Web App (PWA) offline caching and installation.
