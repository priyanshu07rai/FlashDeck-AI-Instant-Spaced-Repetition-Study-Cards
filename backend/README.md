# 🧠 FlashDeck AI - Backend (v2.0)

The engine room of FlashDeck. Now powered by **LangGraph Map-Reduce**.

## 📂 Key Files
-   `agent_graph.py`: **The Core**. Defines the Map-Reduce Graph.
    -   **Mapper**: Batches content (5 images or 4k chars).
    -   **Workers**: Parallel `generate_node` instances.
    -   **Reducer**: `refine_deck` aggregates and deduplicates.
-   `vision_engine.py`: Handles PDF-to-Image conversion for scanned docs.
-   `main.py`: FastAPI entry point.

## 🤖 The Graph (Map-Reduce)
We use LangGraph's `Send` API to parallelize work.

1.  **Chunk/Batch**: The document is split into $N$ batches.
2.  **Map**: $N$ parallel calls are sent to the LLM.
3.  **Reduce**: Results are gathered automatically into `partial_cards`.

## ⚡ Performance
-   **Model**: `google/gemini-3-flash-preview` (Fast & Cheap).
-   **Batching**: 5 Images per API Call = 80% Cost Reduction.
-   **Parallelism**: Async execution for ~15s total processing time.

## 🛠️ Environment
Ensure your `.env` has:
```ini
OPENROUTER_API_KEY=sk-or-v1-...
LANGSMITH_TRACING=true
```
