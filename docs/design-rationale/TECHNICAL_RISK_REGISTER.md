# BorrowNest — Technical Risk Register

This register documents genuine technical, security, and methodological limitations identified during Module 01 and Module 02. Each risk is evaluated with an empirical confidence basis, an impact assessment, clear mitigations, and prototype-blocking status.

---

## Risk Summary Matrix

| Risk ID | Title | Impact | Likelihood / Confidence | Blocks Prototype? | Target Module |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **RISK-01** | Local-Only User Context (No Remote Network) | High | Certain (100% — by design) | No | Module 03+ |
| **RISK-02** | Client-Side Location Privacy Enforcement | Critical | High (if exact addresses stored) | No (Mitigated via DR-05) | Module 03 |
| **RISK-03** | Browser Local Storage Volatility | Medium | Moderate (User clearing cache) | No | Module 03 |
| **RISK-04** | Transitive Dependency Security Advisories | Medium | Verified (6 High Advisories) | No | Future Audit |
| **RISK-05** | GitHub Actions Runner Node Runtime Deprecation | Low | Verified (Action Deprecation Warning) | No | CI Maintenance |
| **RISK-06** | Absence of Empirical Participant Validation | Medium | Certain (100% — Analytical Scope) | No | Post-Prototype |
| **RISK-07** | Storage Transaction Atomicity & Concurrency Integrity | High | Resolved (Module 04 Part A Repairs) | No | Module 04+ |
| **RISK-08** | Reservation Overlap Race Conditions & Multi-Store Atomicity | High | Resolved (Module 05 Concurrency Controls) | No | Module 05+ |

---

## Detailed Risk Assessments

### RISK-01: Local-Only User Context (No Remote Network)
- **Description**: The application runs entirely within the client's local browser runtime. Submitting a borrowing request and approving that request do not transmit real-time network packets or cross-device notifications to an external person.
- **Impact**: Evaluators might mistake the request flow for an active multi-user messaging system.
- **Likelihood / Basis**: **Certain (100%)** — The architecture is explicitly designed as a local-first client prototype.
- **Mitigation**:
  1. Clearly document in the UI that "Borrower" and "Lender" represent functional task perspectives within the local environment.
  2. Display a persistent "Local-First Prototype" pill in the header.
  3. Never simulate fake external user accounts or pretend remote delivery occurred.
- **Blocks Current Prototype?**: **No**. Local-first coordination is an intentional architectural boundary.
- **Relevant Future Module**: Future peer-to-peer or synchronized cloud extensions.

---

### RISK-02: Client-Side Location Privacy Enforcement
- **Description**: In a client-only architecture without an authenticated remote backend, conditional React rendering (e.g., hiding an address behind an `isApproved` flag) provides zero cryptographic or access-control security. Storing exact home addresses in `localStorage` exposes them to browser developer tools.
- **Impact**: Lenders' residential addresses could be accessed by anyone inspecting browser storage.
- **Likelihood / Basis**: **High** if exact street addresses were gathered in the local prototype.
- **Mitigation**:
  1. **Fully Resolved via DR-05**: BorrowNest **never collects or stores exact residential addresses** in the local-first prototype.
  2. Only user-entered coarse neighborhood names (e.g., "North District") are stored.
  3. Explicitly document that true post-approval disclosure requires an authenticated backend with server-side authorization.
- **Blocks Current Prototype?**: **No**. Mitigated by design decision DR-05.
- **Relevant Future Module**: Module 03 (Item Listing Creation) and Module 04 (Discovery).

---

### RISK-03: Browser Local Storage Volatility
- **Description**: Records stored in `localStorage` or `IndexedDB` can be cleared by the user (clearing browser history), aggressive private-browsing modes, or browser storage quota pressure.
- **Impact**: Permanent loss of user-entered listings and loan records on that specific browser.
- **Likelihood / Basis**: **Moderate** — Common behavior when users clear cookies and site data.
- **Mitigation (IMPLEMENTED IN MODULE 03)**:
  1. Implemented a single-click JSON export/backup feature (`exportBackup.js`) in the *Account & Local Data Management* section.
  2. Implemented schema-validated backup restoration (`importBackup.js`) supporting both non-destructive Merge and clean Replace options.
  3. Real-time storage diagnostics displaying estimated quota and current usage via `navigator.storage.estimate()`.
  4. Informs users transparently of browser storage boundaries.
- **Blocks Current Prototype?**: **No**. Resolved with operational client-side backup tools.
- **Implementation Status**: **VERIFIED** in Module 03 test suite.

---

### RISK-04: Transitive Dependency Security Advisories
- **Description**: An official execution of `npm audit --json` verified **6 high-severity vulnerability advisories** within development tooling dependencies.
- **Empirical Audit Findings**:
  - **Advisory Identifier**: [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) (CWE-1333: Regular Expression Denial of Service in `picomatch` through single-branch repeated extglobs; CVSS 7.5 High).
  - **Root Dependency**: `picomatch` (range `<=4.0.7`).
  - **Transitive Propagation Path**:
    - `picomatch` $\rightarrow$ `fdir` $\rightarrow$ `tinyglobby` $\rightarrow$ `vite` (direct) $\rightarrow$ `@vitejs/plugin-react` (direct) and `vitest` (direct).
  - **Vulnerability Count**: 6 high-severity items (all stemming from the single `picomatch` ReDoS advisory in Vite's development server toolchain).
  - **Remediation Status**: npm's automated fix recommends major semver downgrades to Vite 6 (`vite@6.2.7`), which would break React 19 compatibility. Running `npm audit fix --force` is strictly prohibited in Module 02.
- **Impact**: Zero runtime production exposure. The vulnerability exists exclusively in development build tools (`vite` and `vitest` file globbing during local build/test execution) and is not bundled into client-facing production JavaScript.
- **Likelihood / Basis**: **Verified** via direct CLI audit.
- **Mitigation**: Monitor upstream patch releases from the Vite and Vitest core teams that upgrade `picomatch` / `tinyglobby` cleanly. Retain existing build lockfiles without forced breakage.
- **Blocks Current Prototype?**: **No**. Dev-only tooling advisory; does not affect production code.
- **Relevant Future Module**: Future routine dependency maintenance.

---

### RISK-05: GitHub Actions Runner Node Runtime Deprecation
- **Description**: The GitHub Actions runner execution for Module 01 generated informational warnings:
  *"Node.js 20 actions are deprecated. For more information see: https://github.blog/changelog/2024-03-07-github-actions-all-actions-will-run-on-node20-by-default/"*
  stemming from upstream maintainer action runners (`actions/checkout@v4` and `actions/setup-node@v4`).
- **Impact**: Non-breaking informational warning. The workflow completed successfully with exit code 0.
- **Likelihood / Basis**: **Verified** from historical GitHub Actions log output.
- **Mitigation**: Retain official maintained v4 actions. Update action tags to v5 when officially published by GitHub.
- **Blocks Current Prototype?**: **No**. CI pipeline executes and passes completely.
- **Relevant Future Module**: CI workflow maintenance.

---

### RISK-06: Absence of Empirical Participant Validation
- **Description**: All six architectural and design decisions established in Module 02 are expert analytical evaluations based on established literature (MacLean et al., Nielsen Norman heuristics, WCAG 2.2). No empirical user testing, participant interviews, or field trials have been conducted.
- **Impact**: Design assumptions regarding user preferences or category mental models may differ from actual community member behaviors.
- **Likelihood / Basis**: **Certain (100%)** — Empirical testing is out of scope for Module 02.
- **Mitigation**:
  1. Maintain strict honesty: never claim user research was conducted.
  2. Treat all decision outcomes as testable hypotheses.
  3. Plan future usability validation sessions with real participants once a functional interactive prototype exists.
- **Blocks Current Prototype?**: **No**. Analytical QOC is the prescribed methodology.
- **Relevant Future Module**: Future empirical usability testing.

---

### RISK-07: Storage Transaction Atomicity & Concurrency Integrity
- **Description**: Several genuine defects identified during the Module 03 to Module 04 transition compromised data consistency under concurrent actions or faulty backup payloads:
  1. *Archive Lifecycle Race Condition*: Rapid consecutive operations (e.g. toggling availability followed by immediate archiving) fired multiple `refresh()` calls whose out-of-order resolution allowed an older active snapshot to overwrite the newer archived status in React state.
  2. *Non-Atomic Backup Replacement*: `executeReplace` previously executed `clearAllItems()` followed by separate `createItem()` calls in distinct transactions, risking partial data loss if an imported item failed validation mid-way.
  3. *Swallowed Storage Errors*: In `executeMerge`, a generic try-catch block caught all storage errors rather than specifically handling missing records (`RecordNotFoundError`).
  4. *Unvalidated Imported Photos*: Imported backup files could bypass image constraints or inject unstripped EXIF metadata.
- **Impact**: High — Data inconsistency, state desynchronization, and potential local database corruption during import.
- **Remediation Implemented & Verified in Module 04 (Part A)**:
  1. *Request Sequencing*: Added monotonic `requestId` tracking (`refreshCounter.current`) in both `useListings` and `useDiscovery` to discard stale in-flight query responses.
  2. *Single-Transaction Atomic Replace*: Introduced `replaceAllItems(items)` on `StorageAdapter` and `IndexedDbStorageAdapter`, executing `store.clear()` and all `store.put()` calls inside a single `readwrite` IndexedDB transaction with automatic rollback on abort.
  3. *Explicit Merge Error Handling*: Restructured `executeMerge` to only handle `RecordNotFoundError`, re-throwing all fatal storage/quota errors.
  4. *Client-Side Photo Validation & Re-processing*: Added MIME type validation, mandatory `altText` verification, and re-processing of accepted image Blobs through `processItemImage` to strip EXIF and downscale to 1600px.
- **Blocks Current Prototype?**: **No**. Fully resolved and verified with dedicated test suites (`backup.test.js`, `IndexedDbStorageAdapter.test.js`, `LendingPage.test.jsx`).
- **Implementation Status**: **VERIFIED** in Module 04 test suite.

---

### RISK-08: Reservation Overlap Race Conditions & Multi-Store Atomicity
- **Description**: Two competing borrowing requests for the same item over overlapping dates could theoretically be approved simultaneously if availability validation were decoupled from status modification. In addition, backup schema version 2 introduces multi-store dependencies between `items` and `borrowingRequests`.
- **Impact**: High — Double-booking physical equipment, schedule corruption, and inconsistent multi-store restore state.
- **Remediation Implemented & Verified in Module 05**:
  1. *Approval Transaction Serialization*: Approving a request opens a single atomic `readwrite` transaction over `[items, borrowingRequests]`. It queries all existing requests for the item and re-verifies inclusive overlap collision invariants before writing `APPROVED`. Competing transactions serialize deterministically in IndexedDB, guaranteeing exactly 1 success and 1 `ReservationConflictError`.
  2. *Inclusive Overlap Collision Prevention*: Enforces the mathematical interval intersection rule `candidateStart <= existingReturn && existingStart <= candidateReturn`, preventing shared boundary conflicts.
  3. *Overdue Safety Hold*: Approved reservations past their return deadline remain locked to block new overlapping bookings until physical inspection and return in Module 06.
  4. *Multi-Store Atomic Backup Operations*: `replaceAllData` and `mergeAllData` operate across both object stores inside a single `readwrite` transaction, guaranteeing atomic all-or-nothing rollback on any schema or referential failure.
  5. *Relational Integrity Guards*: Item deletion is blocked when borrowing history exists (`ItemHasRequestHistoryError`), and item archiving is blocked when active approved reservations exist (`ItemHasActiveReservationError`).
- **Blocks Current Prototype?**: **No**. Fully mitigated and verified with dedicated concurrency and integration test suites.
- **Implementation Status**: **VERIFIED** in Module 05 test suite (`IndexedDbStorageAdapter.requests.test.js`, `backup.test.js`, `BorrowingIntegration.test.jsx`).

---

### RISK-09: Physical Custody Desynchronization, Three-Store Atomicity & Condition Checkpoint Integrity
- **Description**: Managing physical equipment custody alongside immutable request records introduces potential state synchronization risks:
  1. *Request vs. Custody Coupling*: Conflating owner decisions (`APPROVED`) with physical possession (`ACTIVE`) could allow loans to be completed without physical handover, or allow dates to unlock prematurely.
  2. *Three-Store Transactional Atomicity*: Backup and restore operations now span three interrelated IndexedDB stores (`items`, `borrowingRequests`, `loans`). Non-atomic operations or fallback paths could leave partial state on parse errors or overlap collisions.
  3. *Subjective Liability & Legal Misinterpretation*: Unclear condition ratings or discrepancy notes could be misconstrued as binding digital signatures or legal fault determinations rather than informal peer transparency records.
  4. *Uncollected Reservation Date Locking*: Approved reservations whose pickup dates elapse without physical handover could permanently block the calendar if not provided with a structured owner release mechanism.
  5. *Development Dependency Advisory (picomatch ReDoS)*: `npm audit` reports a high severity ReDoS advisory in `picomatch` transitively pulled in by devDependencies (`vite`, `vitest`, `tinyglobby`). Running `npm audit fix --force` would downgrade Vite to an incompatible major version and break project builds.
- **Impact**: High — Physical possession desynchronization, schedule blocking, legal misinterpretation, or build instability.
- **Remediation Implemented & Verified in Module 06**:
  1. *Decoupled Custody State Machine*: Requests retain immutable owner decision states (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`). Physical custody progresses through a dedicated `loans` store (`RESERVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` or `RELEASED_NOT_COLLECTED`).
  2. *Two-Party Handover Handshake*: Owner records physical condition checkpoint (standardized 1-5 tier, notes, max 5 sanitized photos), and borrower confirms physical receipt before transitioning to `ACTIVE`. Return follows the reverse: borrower marks returned, owner completes return inspection.
  3. *Uncollected Reservation Release*: Explicit owner resolution workflow (`releaseUncollectedReservation`) enables releasing reservations that expired without collection, transitioning status to `RELEASED_NOT_COLLECTED` and immediately unlocking dates for new community bookings.
  4. *Atomic Three-Store Transactions*: Approvals, replacements, and merges execute in single `readwrite` transactions across `[items, borrowingRequests, loans]`. Fallback non-atomic paths are completely removed.
  5. *Informational Transparency Disclaimers*: Clear notices throughout dialogs, cards, and comparison views state that condition checkpoints and confirmations are informational peer records stored locally, not verified digital signatures or legal appraisals.
  6. *DevDependency Advisory Isolation*: Verified with `npm audit --omit=dev` that zero vulnerabilities exist in production runtime code. Documented that `picomatch` is restricted strictly to local build/test tooling and is never bundled into client production assets.
- **Blocks Current Prototype?**: **No**. Fully resolved, protected by relational safeguards, and verified across 205 automated tests and production builds.
- **Implementation Status**: **VERIFIED** in Module 06 test suite (`IndexedDbStorageAdapter.loans.test.js`, `IndexedDbStorageAdapter.migration.test.js`, `backup.test.js`, `LifecycleIntegration.test.jsx`).
