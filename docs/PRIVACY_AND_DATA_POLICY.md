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

In accordance with formal design decision [DR-05](design-rationale/DR-05_LOCATION_PRIVACY.md):
- **Coarse Area Only in Current Prototype**: Item listings gather and display only a coarse, user-defined neighborhood, district, or nearby public landmark area (e.g., "Oakwood District", "Near North Library").
- **Zero Address Harvesting**: Exact residential street addresses, apartment unit numbers, and private access codes are **strictly NOT collected or stored** in the local-first prototype.
- **Client-Side Real-Time Pattern Guard**: The listing creation and editing forms incorporate a real-time heuristic analysis function (`checkPrivacyPatterns`) that flags street addresses, unit numbers, and lockbox PIN combinations, guiding users to enter only general neighborhood descriptions.
- **Future Post-Approval Disclosure**: Two-tier private disclosure (revealing exact addresses only to an approved borrower) is formally recognized as a future capability requiring authenticated user identities, server-side authorization filters, and secure encrypted persistence. In the local-first prototype, what is never collected cannot be compromised.

---

## 4. User-Uploaded Images & Asset Handling

- **Local Processing**: Any photograph uploaded by an item owner is processed entirely client-side using `processItemImage.js`.
- **EXIF & GPS Stripping**: Raw user images are drawn to an in-memory HTML5 Canvas and re-encoded from raw pixel buffers into clean WebP/JPEG Blobs (bounded to 1600px and 2.5MB). This process completely destroys all EXIF metadata, camera serial numbers, and embedded GPS coordinates before the Blob is persisted to IndexedDB.
- **Accessible Descriptions**: Every photograph requires an owner-provided descriptive text (`altText`) before submission to ensure complete accessibility for screen-reader users (WCAG 2.2 SC 1.1.1).
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

## 6. Honest Local-Storage Limitations & Implemented Safeguards

Users are informed transparently regarding the nature of local-first storage:
- **Device-Bound**: Data stored in browser `IndexedDB` does not automatically sync across separate browsers, incognito windows, or devices.
- **Browser Clearing Risks**: If a user clears their browser cache or site data, locally saved records may be erased.
- **Implemented Backup Safeguard**: In Module 03, BorrowNest implements a single-click local JSON backup export (`exportBackup.js`) and schema-validated restore (`importBackup.js`) via the Account & Local Data Management view. Users can export their entire library including photos (encoded to base64) and restore it via Merge (preserving existing items) or Replace (full restore).
