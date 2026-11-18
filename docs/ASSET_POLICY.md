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

## 4. Future User-Uploaded Item Photos

For Modules 03 through 06, user-uploaded listing photos will adhere to the following technical pipeline:
- Client-side EXIF metadata stripping (eliminating GPS and device tags for privacy).
- Client-side image resizing and compression (maintaining aspect ratio and bounding max dimensions to preserve local browser storage capacity).
- Safe rendering using object URLs or Base64 data strings without external server round-trips.
- Compulsory user prompt for accessible description / alt-text when listing an item.
