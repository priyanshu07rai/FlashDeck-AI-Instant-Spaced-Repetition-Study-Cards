# 📜 Version History & Changelog

A detailed timeline of FlashDeck AI's evolution from a simple script to a Multi-Agent System.

---

## 🚀 v2.0.0: "Turbo" Edition (Current)
**Release Date**: Jan 16, 2026
**Codename**: *The Need for Speed*

This release completely re-engineered the backend to handle "Heavy" workloads (Textbooks, 100+ Slide Decks).

### 🏗️ Architectural Changes
-   **Map-Reduce Implementation**: 
    -   *Old*: Sequential (Page 1 -> Page 2 -> Page 3). Slow.
    -   *New*: **Map-Reduce**. The graph splits the PDF into $N$ batches and spins up $N$ concurrent workers.
-   **Vision Pipeline**:
    -   Added `vision_engine.py` using **PyMuPDF**.
    -   System now "Looks" at pages (rendering them as images) instead of just scraping text. This enables support for **Graphs, Charts, and Handwriting**.

### ⚡ Performance Optimizations
-   **Smart Batching**: Groups 5 pages into a single Prompt Context.
    -   *Yield*: Increased from ~5 cards/page to **15-20 cards/batch**.
    -   *Cost*: Reduced API calls by 80%.
-   **Model Switch**: Upgraded from `Gemini 3 Pro` (Slower, Expensive) to `Gemini 3 Flash` (Instant, Efficient).

### 🐛 Bug Fixes
-   Fixed `Refiner` logic where strict key matching (`q`/`a`) caused zero-card output.
-   Fixed `IndentationError` in `main.py` during refactor.
-   Solved "Low Yield" issue by optimizing System Prompts for comprehensiveness.

---

## 🌱 v1.0.0: "Genesis"
**Release Date**: Jan 15, 2026
**Focus**: Proof of Concept

The initial release that established the Agentic workflow.

### Core Features
-   **LangGraph Foundation**: Established the `StateGraph` pattern.
-   **Interactive UI**: Built the React frontend with Sticky Tabs and Grid View.
-   **Basic RAG**: Simple text splitting (RecursiveCharacterTextSplitter) and linear generation.
-   **Anki Integration**: Automated `.apkg` file creation using `genanki`.

---

## 🔮 Roadmap (v3.0 Ideas)
-   [ ] **Vector Memory**: Add a vector store to prevent re-analyzing known topics.
-   [ ] **Quiz Mode**: Interactive quiz interface directly in the browser.
-   [ ] **Video Analysis**: Upload a YouTube link -> Get Flashcards.
