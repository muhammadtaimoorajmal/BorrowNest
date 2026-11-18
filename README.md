# BorrowNest

> **Share what you own. Borrow what you need.**

BorrowNest is an open-source, local-first item-sharing and lending coordination application. It helps individuals and small communities organize useful household and workshop equipment, log borrowing requests, agree on loan durations, coordinate item collection and returns, and maintain transparent item-condition records.

---

## The Problem and Our Solution

### Problem
Household equipment, power tools, gardening implements, and seasonal items are frequently purchased for short-term tasks and remain idle for extended periods. Meanwhile, neighbors and peers who need those tools temporarily often face purchasing costs or difficulty finding someone nearby willing to lend them.

### Solution
BorrowNest provides a focused coordination workspace to:
- Make locally available tools and equipment discoverable.
- Provide clear records of borrowing periods and expected return dates.
- Keep item owners in full control of borrowing approvals.
- Record item condition transparently before and after a loan.
- Protect personal privacy by keeping sensitive collection details private until a request is confirmed.

---

## Technical Stack & Architecture

- **Framework**: React 19 (JavaScript / JSX)
- **Tooling & Build**: Vite 8
- **Styling**: Standard CSS Custom Properties (Design Tokens) and CSS Modules
- **Testing**: Vitest & React Testing Library (JSDOM environment)
- **Code Quality**: ESLint 10 (Flat Config)
- **Deployment & Automation**: GitHub Actions CI Workflow

BorrowNest is architected as a **local-first client-side application**. It stores information directly within the user's browser environment and operates without third-party tracking, external telemetry, or mandatory remote cloud backends.

---

## Prototype Boundaries and Current Limitations

BorrowNest is currently at **Module 01 (Project Foundation)**:
- **Local-Only Storage**: In this initial release, records exist solely within the local browser runtime. Cross-device synchronization and multi-user networking are deliberately not implemented at this stage.
- **No Mock Data**: Per our mandatory data-integrity policy, the application does not ship with pre-populated fake items, synthetic users, or artificial activity feeds.
- **Authentication**: There is no remote authentication service or external identity verification in this local-first prototype.

---

## Privacy Principles & Genuine Asset Policy

- **Data Minimization**: BorrowNest requests only information strictly necessary for lending coordination.
- **Collection Privacy**: Detailed pickup addresses or handoff notes are never exposed publicly; general areas are shown until a loan request is mutually confirmed.
- **Genuine Imagery**: BorrowNest strictly prohibits generic stock photographs in place of genuine items. Future listings rely solely on genuine photographs provided directly by the item owner.
- **Design Target**: Built with semantic HTML and keyboard navigation aiming for WCAG 2.2 Level AA as an intentional design target.

---

## Feature Roadmap

| Module | Scope | Status |
| :--- | :--- | :--- |
| **Module 01** | Project foundation, identity, architectural principles, repository setup, and CI automation | **Implemented** |
| **Module 02** | Formal Question-Option-Criteria (QOC) design rationale across 6 key architectural decision areas | Planned |
| **Module 03** | Genuine item listing management and local persistence | Planned |
| **Module 04** | Discovery, category browsing, and search filtering | Planned |
| **Module 05** | Request submission, owner approval flow, and loan period scheduling | Planned |
| **Module 06** | Handover inspection, condition documentation, and return completion | Planned |

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended; verified on Node.js v24)
- npm (v10+ recommended; verified on npm v11)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/muhammadtaimoorajmal/BorrowNest.git
cd BorrowNest
npm install
```

### Development Scripts

- `npm run dev`: Launch the Vite local development server with hot module reloading.
- `npm run build`: Compile the production application bundle into `dist/`.
- `npm run lint`: Verify code style and syntax rules using ESLint.
- `npm run test`: Run the test suite with Vitest.
- `npm run preview`: Preview the compiled production build locally.

---

## Contributing

Contributions that adhere to our local-first architecture and genuine data policy are welcome. Please ensure that all pull requests pass `npm run lint`, `npm run test`, and `npm run build`.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
