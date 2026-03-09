# 🎨 FlashDeck AI - Frontend Layer

A premium, "Notion-like" interface built for focus and usability.

## 🌟 Design Philosophy
-   **Dark Mode First**: Optimized for late-night study sessions. `#191919` background with subtle borders.
-   **Glassmorphism**: Translucent navbars and cards using `backdrop-blur`.
-   **Minimalism**: Whitespace-heavy with Inter/Sans typography.

## 📦 Tech Stack
-   **Vite**: Fast build tool.
-   **React**: Component-based UI.
-   **Tailwind CSS**: Utility-first styling.
-   **Lucide React**: Beautiful pixel-perfect icons.
-   **html2canvas & jspdf**: Client-side export generation.

## 🧩 Key Components

### `StickyTabs`
A custom navigation component that sticks to the top of the viewport. It organizes the workflow into:
1.  **Upload**: File dropzone / Text input.
2.  **Review**: Grid view of generated cards.
3.  **Export**: Download options.

### `Flashcard Grid`
-   **Hover Effect**: Cards glow on hover.
-   **Focus Modal**: Clicking a card expands it to a full-screen focused view.
-   **Answer Reveal**: Answers are always visible (per user preference upgrade), but cleaner "Flashcard Mode" is available in exports.

## 🚀 Exporting
The frontend handles exports client-side where possible:
-   **PDF**: Renders the grid to a canvas, then scales it (Scale 4.0) for high-DPI PDF output.
-   **PNG**: Captures the DOM element directly.
-   **Anki**: Triggers a backend endpoint to receive a generated `.apkg` file.
