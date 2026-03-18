# Implementation Plan: Info Page Redesign

## Overview

Convert the InfoPage from an `HTMLDialogElement` modal overlay to a full-screen `<div>` page, replace ASCII art `<pre>` diagrams with `<img>` elements referencing SVG files, add a "Back to Menu" callback mechanism, update CSS for full-screen layout, and update `main.ts` wiring to close the menu dialog before showing the page and restore the menu on back navigation.

## Tasks

- [x] 1. Refactor InfoPage class from dialog to full-screen div
  - [x] 1.1 Replace `HTMLDialogElement` with `HTMLDivElement` in InfoPage.ts
    - Change `private dialog: HTMLDialogElement | null` to `private pageElement: HTMLDivElement | null`
    - Add `private onBackToMenu: (() => void) | null = null` field
    - Add `public setOnBackToMenu(callback: () => void): void` method
    - Update `show()` to create a `<div>` with class `info-page` instead of a `<dialog>`, append to `document.body`, no `showModal()` call
    - Update `show()` to call `this.close()` first if already open (idempotence)
    - Replace "Close" button with "Back to Menu" button that fires `onBackToMenu` callback
    - Remove backdrop click handler (not a dialog)
    - Update `close()` to remove the div from DOM and set `pageElement = null`
    - Update `isOpen()` to check `pageElement !== null && document.body.contains(this.pageElement)`
    - Set `aria-label` on the page container div
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3, 3.4, 3.5, 4.3_

  - [x] 1.2 Replace ASCII art `<pre>` blocks with `<img>` elements in `getRulesContent()`
    - Replace the board layout `<pre>` with `<img src="/images/board-layout.svg" alt="Board layout diagram showing three concentric squares with 24 numbered positions" class="info-diagram">`
    - Replace the movement `<pre>` with `<img src="/images/piece-movement.svg" alt="Movement diagram showing a piece at position 1 can move to positions 0, 2, or 9" class="info-diagram">`
    - Replace the mill example `<pre>` with `<img src="/images/mill-example.svg" alt="Mill example showing three white pieces in a row along the top of the outer square" class="info-diagram">`
    - Preserve `.info-diagram-caption` paragraphs below each image
    - Ensure `getHistoryContent()` remains unchanged
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Write property tests for InfoPage (Properties 1–4)
    - **Property 1: Diagram elements are well-formed** — verify zero `<pre>` elements in page body and every `.info-diagram` `<img>` has non-empty `alt`
    - **Validates: Requirements 2.1, 2.3**
    - **Property 2: isOpen reflects DOM state** — generate random sequences of `show()`/`close()`, verify `isOpen()` matches DOM presence
    - **Validates: Requirements 3.4**
    - **Property 3: show is idempotent on DOM element count** — call `show()` N times (1–20), verify exactly one `.info-page` element in DOM
    - **Validates: Requirements 3.5**
    - **Property 4: Heading hierarchy is logically ordered** — verify one `h1`, `h2`s for sections, `h3`s for subsections, no skipped levels
    - **Validates: Requirements 4.4**
    - Create file `frontend/src/controllers/InfoPage.property.test.ts` using `fast-check` and Vitest

- [x] 2. Checkpoint - Verify InfoPage class refactor
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create SVG diagram assets
  - [x] 3.1 Create `frontend/public/images/board-layout.svg`
    - Hand-authored SVG showing the standard Nine Men's Morris board with three concentric squares, connecting lines, and 24 labeled positions
    - _Requirements: 2.2_

  - [x] 3.2 Create `frontend/public/images/piece-movement.svg`
    - Hand-authored SVG showing a piece at position 1 with arrows to adjacent positions 0, 2, and 9
    - _Requirements: 2.2_

  - [x] 3.3 Create `frontend/public/images/mill-example.svg`
    - Hand-authored SVG showing three white pieces forming a mill along the top of the outer square (positions 0, 1, 2)
    - _Requirements: 2.2_

- [x] 4. Update CSS for full-screen page layout
  - [x] 4.1 Rewrite `frontend/src/styles/info-page.css`
    - Replace `.info-page-dialog` dialog-based styles with `.info-page` full-screen page styles (width: 100vw, height: 100vh, overflow-y: auto, position: fixed, top: 0, left: 0, z-index)
    - Update `.info-page-body` to remove `max-height` constraint (page scrolls natively)
    - Update `.info-diagram` styles from `<pre>` monospace to `<img>` responsive styles (max-width: 100%, height: auto, display: block, margin: auto)
    - Rename `.info-page-close` to `.info-page-back` for the "Back to Menu" button
    - Preserve responsive breakpoints for 768px and 480px viewports
    - Preserve `prefers-reduced-motion` and `prefers-contrast` media queries
    - Use CSS custom properties consistent with existing theme
    - _Requirements: 1.2, 1.6, 2.2, 4.1, 4.2, 4.5_

- [x] 5. Update main.ts wiring for navigation integration
  - [x] 5.1 Update `frontend/src/main.ts` InfoPage wiring
    - Add `infoPage.setOnBackToMenu(() => { infoPage.close(); uiManager.showMainMenu(); })` before the `setOnInfoPageRequested` call
    - Update `setOnInfoPageRequested` callback to call `uiManager.closeCurrentDialog()` before `infoPage.show()`
    - _Requirements: 1.1, 1.4, 3.1, 3.2_

- [x] 6. Update existing tests for redesigned InfoPage
  - [x] 6.1 Update `InfoPage.content.test.ts`
    - Update `show and close` tests: replace `.info-page-dialog` selectors with `.info-page`
    - Update close button test: expect "Back to Menu" text instead of "Close"
    - Update diagram tests: verify `<img>` elements with `.info-diagram` class instead of `<pre>` elements
    - Preserve all content assertion tests (history and rules text checks remain valid)
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [x] 6.2 Update `InfoPage.integration.test.ts`
    - Update selectors from `.info-page-dialog` to `.info-page`
    - Update "main menu dialog remains in DOM" test: expect main menu dialog is NOT present (it's closed before showing info page)
    - Add test: clicking "Back to Menu" removes info page and restores main menu
    - Add test: when info page is displayed, no `dialog[open]` elements exist
    - Add test: after navigating back, main menu contains all game mode buttons
    - Update diagram tests to check for `<img>` elements instead of `<pre>` elements
    - _Requirements: 1.1, 1.4, 3.1, 3.2, 2.2_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript throughout; all implementation is frontend-only
- SVG files are hand-authored geometric diagrams, not generated
