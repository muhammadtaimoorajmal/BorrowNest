# Changelog

All notable changes to the BorrowNest project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-18

First official release of BorrowNest — a local-first, peer-to-peer item sharing and lending coordination platform.

### Added
- **Core Architecture & Baseline**:
  - React 19 application foundation with Vite 8 build pipeline and ESLint 10 linting.
  - WCAG 2.2 Level AA accessibility baseline, responsive tokens, and semantic landmark navigation.
  - GitHub Actions CI workflow for automated linting, testing, and production builds.
- **Formal Design Rationale (QOC)**:
  - Documented six formal Question-Option-Criteria analyses across key architectural decision areas (`DR-01` through `DR-06`).
- **Item Listings & Local Persistence**:
  - Genuine item listing lifecycle (`ACTIVE`, `INACTIVE`, `ARCHIVED`) with relational constraints.
  - Native browser IndexedDB persistence via transactional `StorageAdapter`.
  - Client-side EXIF/GPS stripping, resizing, downscaling, and compression to WebP.
  - JSON backup and restore capabilities with schema validation.
- **Unified Item Discovery, Search & Filtering**:
  - Category-based browsing and debounced multi-field text search.
  - Filter state management with availability toggles and sorting.
  - Accessible modal item detail inspector.
- **Borrowing Requests, Owner Decisions & Scheduling**:
  - Structured borrowing request submission with date-range selection.
  - Owner approval and decline workflows with pending request cancellation.
  - Conflict detection preventing overlapping reservations.
  - IndexedDB multi-store transaction synchronization.
- **Physical Handover, Return Verification & Condition Inspection**:
  - Decoupled physical loan custody state machine (`RESERVED`, `ACTIVE`, `COMPLETED`, `RELEASED_NOT_COLLECTED`).
  - Owner collection handover recording and borrower receipt confirmation.
  - 3-column comparative condition inspection across baseline, handover, and return.
  - Uncollected reservation release for elapsed pickup windows.
  - Multi-store backup version 3 with atomic transaction semantics.
- **Release Engineering & Hardening**:
  - Added `.github/dependabot.yml` for automated weekly dependency and action updates.
  - Added comprehensive tag-triggered GitHub Actions CI runs with zero-vulnerability production audits.

### Changed
- Refactored collection confirmation to enforce the calendar window `[collectionDate, returnDeadline]`.
- Updated documentation and README to strictly align with DR-05 (coarse neighborhood area indicators only; zero exact address storage).

### Fixed
- **Return Lifecycle Invariant**: Fixed loan completion protocol to strictly require genuine borrower physical return marking (`borrowerReturnMarkedAt`) before owner condition inspection can proceed, preventing unearned completions.
- Ensured idempotent borrower return marking that does not mutate or overwrite original timestamps on repeated invocations.

### Security
- Verified zero vulnerabilities in production dependency tree (`npm audit --omit=dev`).
- Documented devDependency ReDoS advisory (`GHSA-fc5q-39xc-vjpf` in `picomatch`) isolated strictly to build-time development tools.
