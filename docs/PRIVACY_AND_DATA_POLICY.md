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

## 3. Two-Tier Collection Location Privacy

One of the primary safety concerns in peer item sharing is revealing residential addresses to unknown parties. BorrowNest implements a strict two-stage privacy gate:

1. **Pre-Approval (Public Discovery Tier)**:
   - Only a generalized pickup area is displayed (e.g., "Oakwood District", "Near North Library", "5-minute walk from Central Station").
   - Exact building numbers, apartment codes, and private lockbox combinations remain completely invisible to browsing users.
2. **Post-Approval (Private Handover Tier)**:
   - Detailed collection instructions (such as exact address, specific porch guidance, or collection time windows) are revealed **only after** the owner explicitly clicks to approve a specific borrowing request.
   - If a request is declined, cancelled, or expires, the sensitive collection information is never revealed.

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
