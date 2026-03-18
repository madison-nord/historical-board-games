# Requirements Document

## Introduction

Redesign the existing Information Page for the Nine Men's Morris game. The current implementation uses an `HTMLDialogElement` modal overlay with ASCII art diagrams. The redesign converts the Info Page into a proper full-screen page integrated with the UIManager navigation system, and replaces ASCII art `<pre>` blocks with proper image elements for the board layout, movement, and mill example diagrams.

## Glossary

- **Info_Page**: The full-screen page component that displays game history and rules content, replacing the former dialog-based overlay.
- **UIManager**: The controller responsible for navigating between application screens (main menu, color selection, game, info page) using dialog-based UI patterns.
- **Diagram_Image**: An `<img>` element with descriptive `alt` text that replaces a former ASCII art `<pre>` block for illustrating board concepts.
- **Back_Button**: A navigation button on the Info Page that returns the user to the main menu screen.
- **Main_Menu**: The primary navigation screen showing game mode selection buttons including the "History & Rules" entry point.

## Requirements

### Requirement 1: Convert Info Page from Dialog to Full-Screen Page

**User Story:** As a player, I want the History & Rules content displayed as a proper full-screen page, so that the information feels like a real section of the application rather than a popup overlay.

#### Acceptance Criteria

1. WHEN the user clicks the "History & Rules" button on the Main_Menu, THE UIManager SHALL close the Main_Menu dialog and THE Info_Page SHALL display as a full-screen page element (not an `HTMLDialogElement` modal).
2. WHILE the Info_Page is displayed, THE Info_Page SHALL occupy the full viewport width and height, scrollable vertically when content exceeds the viewport.
3. THE Info_Page SHALL render a "Back to Menu" Back_Button that is visible without scrolling.
4. WHEN the user clicks the Back_Button, THE Info_Page SHALL be removed from the DOM and THE UIManager SHALL display the Main_Menu.
5. THE Info_Page SHALL contain the same history and rules text content as the previous dialog-based implementation.
6. THE Info_Page SHALL use CSS custom properties (variables) consistent with the existing application theme.

### Requirement 2: Replace ASCII Art Diagrams with Image Elements

**User Story:** As a player, I want to see proper graphical images for the board layout, movement, and mill examples, so that the diagrams are visually clear and professional.

#### Acceptance Criteria

1. THE Info_Page SHALL NOT contain any `<pre>` elements with ASCII art diagram content.
2. THE Info_Page SHALL display exactly three Diagram_Image elements in the rules section: one for the board layout, one for piece movement, and one for the mill example.
3. THE Info_Page SHALL render each Diagram_Image with an `alt` attribute that describes the diagram content for screen readers.
4. WHEN a Diagram_Image source file fails to load, THE Info_Page SHALL display the `alt` text as a fallback so the user still receives the diagram description.
5. THE Info_Page SHALL retain the `.info-diagram-caption` text below each Diagram_Image, preserving the existing caption content.

### Requirement 3: Navigation Integration with UIManager

**User Story:** As a player, I want seamless navigation between the main menu and the info page, so that the experience feels like a cohesive application.

#### Acceptance Criteria

1. WHEN the Info_Page is displayed, THE UIManager SHALL have no open dialog elements (the main menu dialog is closed before the Info_Page appears).
2. WHEN the user navigates back from the Info_Page, THE UIManager SHALL restore the Main_Menu to its default state with all game mode buttons available.
3. THE Info_Page SHALL expose a public `show()` method and a public `close()` method that the UIManager or main entry point can call.
4. THE Info_Page SHALL expose a public `isOpen()` method that returns true while the page element is present in the DOM.
5. IF the `show()` method is called while the Info_Page is already open, THEN THE Info_Page SHALL remove the existing page element before creating a new one.

### Requirement 4: Responsive Layout and Accessibility

**User Story:** As a player on any device, I want the info page to be readable and accessible, so that I can learn the game rules regardless of screen size or assistive technology.

#### Acceptance Criteria

1. THE Info_Page SHALL be scrollable on viewports where content exceeds the visible area.
2. WHILE the viewport width is 768 pixels or fewer, THE Info_Page SHALL adjust font sizes and spacing to remain readable on smaller screens.
3. THE Info_Page SHALL set an `aria-label` attribute on the page container describing the page purpose.
4. THE Info_Page SHALL use semantic HTML heading elements (`h1`, `h2`, `h3`) with a logical hierarchy for the page title, section titles, and subsection titles.
5. WHEN the user prefers reduced motion, THE Info_Page SHALL disable scroll animations via the `prefers-reduced-motion` media query.
