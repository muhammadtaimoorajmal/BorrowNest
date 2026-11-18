# BorrowNest — Project Overview

## 1. Product Identity

- **Product Name**: BorrowNest
- **Tagline**: Share what you own. Borrow what you need.
- **Product Type**: Open-source, local-first item-sharing and lending coordination application.
- **License**: MIT License

BorrowNest is designed to help individuals, neighbors, and small community groups organize useful household and workshop items, record borrowing requests, agree on loan durations, coordinate item collection and returns, and maintain transparent records of item condition.

---

## 2. Problem Statement

People frequently require specialized equipment, tools, and household gear for short-term or one-off tasks:
- **Infrequent Use**: Purchasing high-cost tools (such as carpet cleaners, pressure washers, specialty gardening implements, or camping equipment) for rare occasions leads to unnecessary expense and storage clutter.
- **Idle Utility**: Across neighborhoods and social circles, well-maintained tools and equipment sit unused in sheds, basements, and closets for long intervals.
- **Coordination Friction**: Lending between individuals is often disorganized. Informal verbal agreements lead to forgotten return dates, ambiguous pickup locations, and unclear expectations regarding pre-existing wear or damage.

BorrowNest addresses these challenges by introducing structured, reliable, and private coordination without forcing users into centralized corporate platforms or ad-supported marketplaces.

---

## 3. Product Vision

BorrowNest envisions self-reliant, sustainable communities where tools and household items are readily shared with confidence. The application empowers users to retain complete ownership over their data, their items, and their schedule through a responsive, dignified, and local-first user experience.

---

## 4. Intended Audience

BorrowNest is built for:
- **Neighbors and Community Groups**: Residents wishing to share gardening tools, repair equipment, or seasonal decor.
- **Hobbyists and Makers**: Woodworkers, electronics tinkerers, and crafters sharing specialty equipment.
- **Clubs and Interest Groups**: Hiking groups, sports clubs, or parent groups coordinating communal gear and recreational supplies.
- **General Households**: Anyone seeking to borrow occasionally rather than buy permanently, while extending the useful life of items they already own.

*(Note: The product is general-purpose and designed for real-world peer coordination. All demographic and market assumptions are treated as hypotheses subject to user validation.)*

---

## 5. Product Objectives

BorrowNest is engineered to achieve seven core product objectives:

1. **Discoverability of Available Items**: Enable clear categorization, searching, and status inspection of tools and household equipment.
2. **Clarity of Borrowing Arrangements**: Establish agreed-upon start and end dates with unambiguous return expectations.
3. **Owner Control Over Requests**: Grant item owners unilateral discretion to approve, decline, or communicate terms for any borrowing request.
4. **Visibility of Collection and Return Timelines**: Present clear indicators of upcoming return dates, active loans, and overdue items.
5. **Transparency in Item Condition**: Provide simple, honest records of pre-existing wear at checkout and condition verification upon return.
6. **Privacy Around Collection Information**: Shield residential privacy by collecting and displaying only coarse neighborhood areas, avoiding exact address harvesting entirely (DR-05).
7. **Cross-Device Usability**: Offer an accessible, responsive interface optimized for both mobile devices and desktop displays.

---

## 6. Core Value Proposition

| Traditional Informal Lending | BorrowNest Coordination |
| :--- | :--- |
| Forgotten loan timelines and awkward follow-ups | Explicit, agreed dates with visible countdowns |
| Disputes over pre-existing scuffs or damage | Documented condition checkpoints at handoff and return |
| Public exposure of residential addresses | Coarse neighborhood tags only; zero collection of private street addresses in the local prototype (DR-05) |
| Bloated cloud platforms requiring logins, tracking, and ads | Private, client-side, local-first application with zero surveillance |

---

## 7. Project Boundaries

- **Local-First Client Runtime**: BorrowNest operates directly inside the modern web browser. It does not require a remote server backend, user accounts, or proprietary cloud synchronization in this release.
- **General-Purpose Focus**: The application is designed strictly as a real-world tool for everyday sharing. It avoids artificial demonstration scenarios.
- **Data Integrity Guarantee**: BorrowNest strictly prohibits fabricated statistics, synthetic user profiles, and stock imagery. Every record must represent genuine user actions.

---

## 8. Current Implementation Status

| Milestone | Deliverables | Current Status |
| :--- | :--- | :--- |
| **Module 01: Project Foundation** | React 19 + Vite 8 workspace, design tokens, responsive empty-state shell, unit tests, GitHub Actions CI workflow, and architectural documentation | **COMPLETED & VERIFIED** |
| **Module 02: Architectural Decision Records** | Formal Question-Option-Criteria (QOC) analysis for six core design areas ([docs/design-rationale/](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/)) | **COMPLETED & VERIFIED** |
| **Module 03: Item Management & Local Persistence** | Genuine item CRUD, responsive 4-section navigation, native IndexedDB persistence, client-side EXIF/GPS-stripped photo pipeline, and JSON backup export/restore | **COMPLETED & VERIFIED** |
| **Module 04: Discovery & Search** | Keyword filtering, category exploration, and availability toggles | Planned |
| **Module 05: Borrowing Flow** | Request submissions, owner approval states, and scheduling calendar | Planned |
| **Module 06: Inspection & Returns** | Handover condition comparison and loan lifecycle closure | Planned |
