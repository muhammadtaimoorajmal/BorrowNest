# BorrowNest — Authoritative Evidence Register

This register documents the verified foundational evidence sources (E-01 through E-05) utilized across all six Question-Option-Criteria (QOC) design analyses.

---

## Source E-01: QOC Design Space Analysis Framework

- **Source ID**: `E-01`
- **Citation**: MacLean, A., Young, R. M., Bellotti, V. M. E., & Moran, T. P. (1991). *"Questions, Options, and Criteria: Elements of Design Space Analysis."* **Human–Computer Interaction**, 6(3–4), 201–250.
- **Publisher / Organization**: Lawrence Erlbaum Associates / Taylor & Francis.
- **Canonical URL / DOI**: [https://doi.org/10.1080/07370024.1991.9667168](https://doi.org/10.1080/07370024.1991.9667168)
- **Relevant Concept**: Semi-formal representation of design reasoning using Questions, Options, and Criteria to structure the exploration of alternative designs, expose implicit trade-offs, and produce an auditable historical justification.
- **Decisions Supported**: DR-01, DR-02, DR-03, DR-04, DR-05, DR-06.
- **Application in BorrowNest**: Establishes the core methodology, 5-point rating scale, weighting formulation, and comparative evaluation matrices.
- **Known Limitations**: Focuses on structuring design discussions and rationales; does not replace empirical user validation.

---

## Source E-02: Nielsen's Ten Usability Heuristics

- **Source ID**: `E-02`
- **Citation**: Nielsen, J. (1994, continuously maintained). *"10 Usability Heuristics for User Interface Design."* **Nielsen Norman Group**.
- **Organization**: Nielsen Norman Group (NN/g).
- **Canonical URL**: [https://www.nngroup.com/articles/ten-usability-heuristics/](https://www.nngroup.com/articles/ten-usability-heuristics/)
- **Relevant Principles**:
  - **Heuristic #1: Visibility of System Status**: Systems must keep users informed about what is happening through appropriate, timely feedback (supports request status, approval states, active loan badges).
  - **Heuristic #2: Match Between System and the Real World**: Systems should use natural language, familiar concepts, and real-world metaphors (supports peer lending lifecycles: listing, borrowing, collecting, returning).
  - **Heuristic #3: User Control and Freedom**: Provide clear exits, cancellation paths, and filter resets without forced dead ends (supports request cancellation, filter reset controls).
  - **Heuristic #4: Consistency and Standards**: Follow platform conventions so users do not wonder whether different words or actions mean the same thing (supports standard form inputs, status labels).
  - **Heuristic #5: Error Prevention**: Eliminate error-prone conditions or check for them and present confirmation options before commitment (supports overlapping date conflict validation, preventing actions on closed requests).
  - **Heuristic #6: Recognition Rather than Recall**: Minimize user memory load by making elements, actions, and options visible (supports category pills, active filter tags, visible status badges).
  - **Heuristic #7: Flexibility and Efficiency of Use**: Cater to both novice and experienced users (supports combining direct keyword search with exploratory category browsing).
  - **Heuristic #8: Aesthetic and Minimalist Design**: Dialogues should not contain irrelevant or rarely needed information (supports progressive location disclosure, clean form fields).
  - **Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors**: Error messages should be expressed in plain language, indicate the problem, and suggest a constructive solution (supports explicit date conflict notices and zero-results search guidance).
- **Decisions Supported**: DR-01, DR-02, DR-03, DR-04, DR-05, DR-06.
- **Known Limitations**: Heuristics are broad evaluative guidelines and require domain-specific interpretation for local-first peer-lending dynamics.

---

## Source E-03: W3C Web Content Accessibility Guidelines (WCAG) 2.2

- **Source ID**: `E-03`
- **Citation**: World Wide Web Consortium (W3C) Web Accessibility Initiative (WAI) (2023). *"Web Content Accessibility Guidelines (WCAG) 2.2."* **W3C Recommendation**.
- **Organization**: World Wide Web Consortium (W3C).
- **Canonical URL**: [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/)
- **Relevant Success Criteria**:
  - **SC 1.3.1 Info and Relationships (Level A)**: Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.
  - **SC 1.4.3 Contrast (Minimum) (Level AA)**: Visual presentation of text and images of text has a contrast ratio of at least 4.5:1 (3:1 for large text).
  - **SC 2.1.1 Keyboard (Level A)**: All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.
  - **SC 2.4.7 Focus Visible (Level AA)**: Any keyboard-operable user interface has an operable mode where the keyboard focus indicator is visible.
  - **SC 2.5.8 Target Size (Minimum) (Level AA)**: The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except where spacing or inline context exempts it.
  - **SC 2.5.5 Target Size (Enhanced) (Level AAA)**: The size of the target for pointer inputs is at least 44 by 44 CSS pixels.
  - **SC 3.3.1 Error Identification (Level A)**: If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.
  - **SC 3.3.2 Labels or Instructions (Level A)**: Labels or instructions are provided when content requires user input.
- **Critical Clarification Regarding Target Sizes**:
  - In WCAG 2.2, **24 × 24 CSS pixels is the Level AA minimum** (SC 2.5.8).
  - **44 × 44 CSS pixels is the Level AAA enhanced criterion** (SC 2.5.5).
  - BorrowNest maintains an internal ergonomic baseline of **44 × 44 CSS pixels** for primary mobile navigation and touch buttons as an intentional design decision that exceeds the Level AA minimum. It is **not** misrepresented as the general Level AA threshold.
- **Decisions Supported**: DR-01, DR-02, DR-03, DR-04, DR-06.
- **Known Limitations**: Formal automated WCAG compliance checkers do not verify qualitative user comprehension or mental model clarity.

---

## Source E-04: W3C Form Control Labeling

- **Source ID**: `E-04`
- **Citation**: W3C Web Accessibility Initiative (WAI). *"Form Control Labeling."* **Web Accessibility Tutorials**.
- **Organization**: World Wide Web Consortium (W3C).
- **Canonical URL**: [https://www.w3.org/WAI/tutorials/forms/labels/](https://www.w3.org/WAI/tutorials/forms/labels/)
- **Relevant Guidance**: Form controls must have explicit `<label>` elements associated with them via matching `for` and `id` attributes. Placeholder text must never be used as a substitute for a persistent label because it disappears upon user entry and lacks adequate contrast.
- **Decisions Supported**: DR-01, DR-02, DR-03, DR-04.
- **Application in BorrowNest**: Applied to search input fields, borrowing period date pickers, condition dropdowns, and request note textareas.
- **Known Limitations**: Focuses on assistive technology programmatic association; does not dictate visual form styling.

---

## Source E-05: W3C Form Instructions and Validation

- **Source ID**: `E-05`
- **Citation**: W3C Web Accessibility Initiative (WAI). *"Form Instructions and Error Handling."* **Web Accessibility Tutorials**.
- **Organization**: World Wide Web Consortium (W3C).
- **Canonical URL**: [https://www.w3.org/WAI/tutorials/forms/instructions/](https://www.w3.org/WAI/tutorials/forms/instructions/)
- **Relevant Guidance**: Forms must provide upfront format requirements (e.g., date formats, expected return deadlines), clear inline validation messages linked via `aria-describedby`, and non-color-dependent status indicators.
- **Decisions Supported**: DR-02, DR-03, DR-04.
- **Application in BorrowNest**: Applied to scheduling date ranges, explaining booking conflicts, and guiding collection/return condition documentation.
- **Known Limitations**: General form guidance that must be tailored to peer lending state machines.
