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
- **Request Submission**: Submit a structured borrowing request specifying start date, return date, and intended usage notes.
- **Duration Agreement**: Provide unambiguous date ranges for the loan.
- **Owner Governance**: Empower item owners to review, accept, or decline pending requests.
- **Status Progression**: Track request lifecycle from `Requested` $\rightarrow$ `Approved` $\rightarrow$ `Collected` $\rightarrow$ `Returned` $\rightarrow$ `Completed`.
- **Collection & Return Logging**: Timestamp physical item collection and return events.

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

## 4. Current Local-First Boundaries & Module 04 Status

The Module 04 implementation delivers complete unified item discovery, search, and filtering alongside genuine item listing management and local IndexedDB persistence. Users and evaluators should recognize the following real constraints and implemented capabilities:

- **Unified Item Discovery (DR-01)**: Fully functional local catalog exploration featuring multi-token keyword search, category exploration pills (*All*, *Tools*, *Gardening*, *Household*, *Outdoor*, *Electronics*), progressive availability toggle (*Available now only*), and reactive results feedback with a one-click filter reset action.
- **Read-Only Borrower Perspective**: Clean item cards and an accessible detail dialog (`ItemDetailModal`) presenting photos, condition descriptions, and coarse pickup areas without owner-only management buttons.
- **Local Storage Scope**: Data stored in native `IndexedDB` is confined to the specific browser profile and device where it was entered.
- **No Automatic Cross-Device Sync**: Creating a listing on a smartphone will not automatically mirror onto a desktop browser without manual export/import or future peer-to-peer sync mechanisms.
- **Cache Clearance Impact & Mitigation**: Clearing browser site data will remove locally stored listings. To directly address this risk, client-side JSON backup export and validated restore (both merge and single-transaction atomic replace modes) are available via the Account & Local Data Management view.
- **Real-Time Address Safeguard**: In accordance with DR-05, listings require coarse neighborhood tags and feature real-time heuristic pattern detection warning users against entering specific street addresses or gate codes.
- **Future Module Boundaries**: Structured borrowing requests and reservation scheduling arrive in Module 05; physical handover condition checklists and return completion arrive in Module 06.

---

## 5. Future Extension Boundaries

Future iterations may explore:
- Peer-to-peer or local network synchronization (e.g., WebRTC or encrypted export/import bundles).
- Calendar file exports (`.ics`) for return reminders.
- Progressive Web App (PWA) offline caching and installation.
