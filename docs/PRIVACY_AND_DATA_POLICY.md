# BorrowNest — Privacy and Data Integrity Policy

## 1. Principles of Data Privacy

BorrowNest is built upon the foundational belief that peer coordination tools should protect user privacy by default. In an era of pervasive tracking and unnecessary data harvesting, BorrowNest adopts an uncompromising stance on user privacy and data sovereignty.

---

## 2. Data Minimization & Collection Standards

BorrowNest strictly practices **data minimization**:
- **No Unnecessary Personal Information**: The application does not collect governmental IDs, telephone numbers, financial details, credit scores, social media handles, or biometric markers.
- **Identity Fields**: Borrower and owner identification within the local-first prototype are lightweight aliases or handles chosen freely by the user.
- **Zero Third-Party Telemetry**: The application contains no tracking scripts, advertising beacons, tracking pixels, or cross-site analytics cookies.

---

## 3. Collection Location Privacy and Local-First Boundary (DR-05 Resolution)

One of the primary safety concerns in peer item sharing is protecting residential addresses. In a local-first client application with no authenticated remote server, client-side conditional rendering (e.g., hiding text behind a React state flag) does **not** constitute an authorization security boundary. Storing exact home addresses in local browser storage creates an unacceptable risk of exposure.

In accordance with formal design decision [DR-05](file:///D:/ALL%20DATA/PROJECTS/HCI_Week-13_Lab-11/docs/design-rationale/DR-05_LOCATION_PRIVACY.md):
- **Coarse Area Only in Current Prototype**: Item listings gather and display only a coarse, user-defined neighborhood, district, or nearby public landmark area (e.g., "Oakwood District", "Near North Library").
- **Zero Address Harvesting**: Exact residential street addresses, apartment unit numbers, and private access codes are **strictly NOT collected or stored** in the local-first prototype.
- **Future Post-Approval Disclosure**: Two-tier private disclosure (revealing exact addresses only to an approved borrower) is formally recognized as a future capability requiring authenticated user identities, server-side authorization filters, and secure encrypted persistence. In the local-first prototype, what is never collected cannot be compromised.

---

## 4. User-Uploaded Images & Asset Handling

- **Local Processing**: Any photograph uploaded by an item owner is processed entirely client-side.
- **EXIF Stripping**: Image metadata (including embedded GPS coordinates, camera serial numbers, and device timestamps) must be stripped before persisting the image in local browser storage to prevent unintended geolocation leakage.
- **No Remote Leakage**: Uploaded images remain stored in the user's browser environment and are not broadcast to third-party image hosting services.

---

## 5. Mandatory Data-Integrity Policy

BorrowNest enforces an explicit project-wide data-integrity rule: **No Fabricated or Misleading Data**.

### Strictly Prohibited in the Application:
- Fake user profiles or artificial accounts.
- Invented personal names or fictitious identities.
- Fake item listings or seeded mock inventory.
- Invented item availability or phantom reservations.
- Artificial borrowing requests or simulated transactions.
- Fabricated reviews, ratings, or testimonials.
- Simulated activity counters or fake community statistics.
- Placeholder "Lorem ipsum" copy in user-facing views.
- Stock photographs presented as real available items.

### Genuine Initial State
- The initial state of the application must be genuinely empty.
- When no listings exist, the application presents a professional empty state explaining that the user has not added items yet.
- Records must originate exclusively from actual user inputs or genuine user-provided files.
- Synthetic fixtures are restricted strictly to automated test suites (`*.test.jsx`) and are never imported into production builds.

---

## 6. Honest Local-Storage Limitations

Users must be informed transparently regarding the nature of local-first storage:
- **Device-Bound**: Data stored in browser storage (`localStorage` or `IndexedDB`) does not automatically sync across separate browsers, incognito windows, or devices.
- **Browser Clearing Risks**: If a user clears their browser cache or site data, locally saved records may be permanently erased.
- **Export Recommendations**: Users are encouraged to utilize future backup/export capabilities to maintain long-term local archives of their lending histories.
