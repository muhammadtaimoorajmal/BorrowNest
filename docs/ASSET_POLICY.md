# BorrowNest — Asset and Imagery Policy

## 1. Core Principles

BorrowNest coordinates real-world item borrowing between people. Genuine visual representations are essential for safety, trust, and accurate condition assessment. This policy governs the usage, attribution, and handling of all imagery and graphical assets across the project.

---

## 2. Seven Mandatory Asset Rules

1. **Actual Item Representation**: Item photographs must represent the specific, physical item being offered for lending. Listings must show the actual object, including any visible wear, scratches, or unique markings.
2. **No Stock Photo Substitution**: Uploaded item photographs must never be replaced by glossy manufacturer stock photos or generic commercial imagery. Stock imagery creates false expectations regarding condition, accessories, and wear.
3. **Verified Licensing for Decorative Assets**: Any external decorative asset, icon font, or illustrative artwork integrated into the interface must possess an open, verified usage license (e.g., MIT, CC-BY, or CC0).
4. **Attribution and Source Logging**: For every external asset included in the repository, the creator, source URL, exact license version, and attribution text must be documented explicitly in this asset policy.
5. **Local Asset Storage**: All application imagery and icons must be stored locally within the repository or browser storage rather than hotlinked from third-party hosts. Hotlinking introduces privacy leaks, vulnerability to link rot, and external tracking risks.
6. **Strict Copyright Compliance**: No copyrighted illustration, photography, or logo may be incorporated into BorrowNest without verifiable permission or a compatible open-source license.
7. **Accessibility & Alternative Text**: Every image, diagram, and brand asset must provide meaningful alternative text (`alt` attribute) or be marked as decorative (`aria-hidden="true"`) to ensure complete accessibility for screen reader users.

---

## 3. Module 01 Asset Registry

Module 01 does not include any external stock photographs. All visual brand assets are original vector graphics created specifically for BorrowNest.

| Asset Path | Type | Creator / Source | License | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- |
| `public/favicon.svg` | SVG Vector | BorrowNest Project | MIT | Browser tab icon: Stylized nest cradle with lending loop in teal and amber. |
| `public/borrownest-logo.svg` | SVG Vector | BorrowNest Project | MIT | Full brand mark and wordmark vector graphic. |
| `src/components/BrandMark.jsx` | React SVG Component | BorrowNest Project | MIT | Inline accessible SVG brand mark and wordmark. |
| `src/components/EmptyState.jsx` | React SVG Component | BorrowNest Project | MIT | Stylized open nest zero-state illustrative icon. |

---

## 4. Implemented User-Uploaded Item Photo Pipeline (Module 03)

In Module 03, user-uploaded listing photos strictly adhere to the implemented client-side media pipeline (`src/features/listings/services/processItemImage.js`):
- **EXIF & Geolocation Stripping**: Raw user images are drawn to an in-memory HTML5 Canvas and re-encoded from raw pixel buffers into clean WebP/JPEG Blobs. This process completely destroys all EXIF metadata, camera serial numbers, and embedded GPS coordinates before the Blob is persisted to IndexedDB.
- **Client-Side Resizing & Compression**: Bounded to a maximum dimension of 1600px (`calculateBoundedDimensions`) and compressed to WebP/JPEG format bounded by a maximum file size of 2.5MB to preserve local IndexedDB storage capacity.
- **Genuine Attestation Safeguard**: Owners must check a mandatory attestation confirming that the uploaded image depicts the actual, physical item they own rather than a stock photo or online render.
- **Mandatory Accessible Alt Text**: Every uploaded photograph requires an owner-provided descriptive text (`altText`) before form submission, ensuring full accessibility for screen-reader users (WCAG 2.2 SC 1.1.1).
- **Safe Object URL Rendering**: Rendered safely via `URL.createObjectURL` and revoked deterministically upon unmount or change to prevent browser memory leaks.

---

## 5. Curated Demonstration Catalogue Imagery (Module 08)

For first-time visitors encountering an empty browser state, BorrowNest provides a curated, read-only demonstration catalogue of exactly 20 items:
- **Verified Physical Photography**: Every demonstration product has been visually verified to depict the actual physical equipment described in the title and description (Tools: 5, Gardening: 4, Household: 4, Outdoor: 4, Electronics: 3). Fictional condition inspection ratings, synthetic AI renders, and misleading stock placeholders are strictly banned.
- **Local Storage & Zero Hotlinking**: All 20 photographs are stored directly in `public/demo/items/` at standardized 4:3 catalogue dimensions (600 × 450 px), ensuring zero external network dependencies and zero third-party tracking.
- **Attribution Registry**: Comprehensive provenance, photographer credits, and reusable license records (Unsplash and Pexels licenses) are maintained in [`docs/assets/DEMO_IMAGE_ATTRIBUTIONS.md`](assets/DEMO_IMAGE_ATTRIBUTIONS.md).
- **Contact Sheet**: Visual verification reference compiled in [`docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp`](assets/DEMO_CATALOGUE_CONTACT_SHEET.webp).
- **IndexedDB Isolation**: Demonstration items exist only as static application data and are never inserted into the browser's IndexedDB storage. Local personal inventory remains strictly private and isolated.
