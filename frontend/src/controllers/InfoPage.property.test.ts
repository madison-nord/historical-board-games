import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { InfoPage } from './InfoPage.js';

describe('InfoPage Property-Based Tests', () => {
  let infoPage: InfoPage;

  afterEach(() => {
    // Clean up DOM after each test
    if (infoPage) {
      infoPage.close();
    }
    // Remove any stray .info-page elements
    document.querySelectorAll('.info-page').forEach(el => el.remove());
  });

  // Feature: info-page-redesign, Property 1: Diagram elements are well-formed
  // For any rendered InfoPage, there shall be zero <pre> elements in the page body,
  // and every <img> element with class info-diagram shall have a non-empty alt attribute.
  // **Validates: Requirements 2.1, 2.3**
  it('Property 1: Diagram elements are well-formed', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (actions: boolean[]) => {
          infoPage = new InfoPage();

          // Execute a random sequence of show/close, ending with show so page is rendered
          for (const action of actions) {
            if (action) {
              infoPage.show();
            } else {
              infoPage.close();
            }
          }

          // Ensure page is open for inspection
          if (!infoPage.isOpen()) {
            infoPage.show();
          }

          const pageEl = document.querySelector('.info-page');
          expect(pageEl).not.toBeNull();

          // No <pre> elements in the page body
          const preElements = pageEl!.querySelectorAll('pre');
          expect(preElements.length).toBe(0);

          // Every .info-diagram img has a non-empty alt attribute
          const diagrams = pageEl!.querySelectorAll('img.info-diagram');
          expect(diagrams.length).toBeGreaterThan(0);
          diagrams.forEach(img => {
            const alt = img.getAttribute('alt');
            expect(alt).not.toBeNull();
            expect(alt!.trim().length).toBeGreaterThan(0);
          });

          // Cleanup for next iteration
          infoPage.close();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: info-page-redesign, Property 2: isOpen reflects DOM state
  // For any sequence of show() and close() calls on an InfoPage instance,
  // isOpen() shall return true if and only if the page element is currently present in the DOM.
  // **Validates: Requirements 3.4**
  it('Property 2: isOpen reflects DOM state', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (actions: boolean[]) => {
          infoPage = new InfoPage();

          for (const action of actions) {
            if (action) {
              infoPage.show();
            } else {
              infoPage.close();
            }

            // After each call, isOpen() must match DOM presence
            const pageInDom = document.querySelector('.info-page') !== null;
            expect(infoPage.isOpen()).toBe(pageInDom);
          }

          // Cleanup for next iteration
          infoPage.close();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: info-page-redesign, Property 3: show is idempotent on DOM element count
  // For any number of consecutive show() calls (1-20), there shall be exactly one
  // .info-page element in the DOM.
  // **Validates: Requirements 3.5**
  it('Property 3: show is idempotent on DOM element count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (n: number) => {
          infoPage = new InfoPage();

          // Call show() N times consecutively
          for (let i = 0; i < n; i++) {
            infoPage.show();
          }

          // There must be exactly one .info-page element in the DOM
          const infoPages = document.querySelectorAll('.info-page');
          expect(infoPages.length).toBe(1);

          // Cleanup for next iteration
          infoPage.close();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: info-page-redesign, Property 4: Heading hierarchy is logically ordered
  // For any rendered InfoPage, all heading elements shall follow a logical hierarchy:
  // exactly one h1, h2 for sections, h3 for subsections, no heading level skipped.
  // **Validates: Requirements 4.4**
  it('Property 4: Heading hierarchy is logically ordered', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }),
        (actions: boolean[]) => {
          infoPage = new InfoPage();

          // Execute random show/close sequence, ending with page open
          for (const action of actions) {
            if (action) {
              infoPage.show();
            } else {
              infoPage.close();
            }
          }

          // Ensure page is open for inspection
          if (!infoPage.isOpen()) {
            infoPage.show();
          }

          const pageEl = document.querySelector('.info-page');
          expect(pageEl).not.toBeNull();

          // Collect all heading elements in document order
          const headings = pageEl!.querySelectorAll('h1, h2, h3, h4, h5, h6');
          expect(headings.length).toBeGreaterThan(0);

          // Exactly one h1
          const h1s = pageEl!.querySelectorAll('h1');
          expect(h1s.length).toBe(1);

          // Verify heading hierarchy: no level is skipped
          // Track the current deepest level seen so far
          let maxLevelSeen = 0;
          headings.forEach(heading => {
            const level = parseInt(heading.tagName.substring(1), 10);

            // A heading level should not skip more than one level from what we've seen
            // e.g., h1 -> h3 without h2 is invalid
            if (level > maxLevelSeen + 1 && maxLevelSeen > 0) {
              expect.fail(
                `Heading hierarchy violation: found <${heading.tagName.toLowerCase()}> ` +
                  `but max level seen so far is h${maxLevelSeen}. ` +
                  `Expected h${maxLevelSeen + 1} or lower before h${level}.`
              );
            }

            if (level > maxLevelSeen) {
              maxLevelSeen = level;
            }
          });

          // Verify h2 elements exist (section headings)
          const h2s = pageEl!.querySelectorAll('h2');
          expect(h2s.length).toBeGreaterThan(0);

          // Verify h3 elements exist (subsection headings)
          const h3s = pageEl!.querySelectorAll('h3');
          expect(h3s.length).toBeGreaterThan(0);

          // Cleanup for next iteration
          infoPage.close();
        }
      ),
      { numRuns: 100 }
    );
  });
});
