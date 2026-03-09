import os
import operator
import json
from typing import List, TypedDict, Annotated, Dict, Any, Union
from typing_extensions import TypedDict as ExtTypedDict

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, END, START
from langgraph.types import Send
from pydantic import BaseModel, Field
from dotenv import load_dotenv, find_dotenv

# --- SETUP ---
# Load env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in .env")

# Model Config
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    model="google/gemini-2.0-flash-001",
    default_headers={
        "HTTP-Referer": "http://localhost:8501",
        "X-Title": "FlashDeckAgent"
    }
)

# --- SCHEMAS ---

class Flashcard(BaseModel):
    q: str = Field(description="Question")
    a: str = Field(description="Answer")

class CardList(BaseModel):
    cards: List[Flashcard]

# Main Graph State (Defined ONCE)
class DeckState(TypedDict):
    original_text: Union[str, List[str]] # Text or List of Base64 Images
    # The reducer will automatically aggregate lists of lists (if we output list) 
    # OR we append to partial_cards list.
    partial_cards: Annotated[List[Dict], operator.add] 
    final_cards: List[Dict]
    # Required for mapper logic
    batches: List[List[str]]

# Worker State (Input for Map)
class BatchInput(TypedDict):
    batch_content: List[str] # List of 5 images OR text chunk

# --- HELPERS ---

def clean_json_string(s: str) -> str:
    """Clean markdown code blocks from string"""
    s = s.strip()
    if s.startswith("```json"):
        s = s[7:]
    if s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    return s.strip()

def safe_parse(parser, raw: str):
    """Robust parsing with fallback"""
    try:
        return parser.parse(raw)
    except Exception:
        print("[DEBUG] Standard parse failed. Attempting cleanup.")
        cleaned = clean_json_string(raw)
        try:
            return json.loads(cleaned)
        except Exception as e:
            print("[ERROR] Final JSON parse failed")
            print(f"Raw Content Snippet: {raw[:500]}")
            raise e

# --- NODES ---

def chunk_document(state: DeckState):
    """
    MAPPER: splits content into batches.
    """
    print("--- NODE: CHUNKER (MAPPER) ---")
    content = state['original_text']
    
    batches = []
    
    # 1. Vision Mode (List of images)
    if isinstance(content, list):
        BATCH_SIZE = 5
        print(f"Vision Mode: {len(content)} pages. Batching by {BATCH_SIZE}...")
        for i in range(0, len(content), BATCH_SIZE):
            batches.append(content[i:i + BATCH_SIZE])
            
    # 2. Text Mode (String) - Ensure we handle whatever format 'content' is
    else:
        text = str(content)
        splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=200)
        docs = splitter.create_documents([text])
        batches = [[d.page_content] for d in docs] 

    print(f"Created {len(batches)} batches/jobs.")
    return {"batches": batches}

def generate_batch_node(state: BatchInput):
    """
    WORKER: Processes a single batch of images/text.
    """
    batch = state['batch_content']
    print(f"--- WORKER: Processing Batch ({len(batch)} items) ---")
    
    generated = []
    parser = JsonOutputParser(pydantic_object=CardList)
    
    # Check if this batch is Images (Vision) or Text
    first_item = batch[0]
    # Improved Heuristic: Base64 strings usually have no spaces and look 'random'.
    # Safest is to rely on what vision engine produced, which is List[str] vs text engine str.
    # But batch input is just List[str].
    is_image = len(first_item) > 200 and " " not in first_item[:50] 
    
    try:
        if is_image:
            # Construct ONE Multimodal Message for the whole batch
            content_parts = [
                {"type": "text", "text": "Analyze these document slides/pages. Create 15-20 high-quality flashcards covering EVERY key concept shown across these pages. Be comprehensive. Return valid JSON only. Format: {\"cards\": [{\"q\": \"...\", \"a\": \"...\"}]}"}
            ]
            for img in batch:
                content_parts.append({
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                })
                
            msg = {"role": "user", "content": content_parts}
            res = llm.invoke([msg])
            raw_content = res.content
            print(f"[DEBUG] Vision Raw Response: {raw_content[:200]}...")
            
            parsed = safe_parse(parser, raw_content)
            
            if isinstance(parsed, dict) and "cards" in parsed:
                generated = parsed['cards']
            elif isinstance(parsed, list):
                generated = parsed
            
        else:
            # Text Batch
            text_blob = "\n\n".join(batch)
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an expert tutor. Create 15-20 high-quality flashcards covering all topics in the text. Return JSON with 'q' and 'a' keys."),
                ("user", "{text}")
            ])
            
            chain = prompt | llm 
            res = chain.invoke({"text": text_blob})
            
            raw_content = res.content
            print(f"[DEBUG] Text Raw Response: {raw_content[:200]}...")
            
            parsed = safe_parse(parser, raw_content)

            if isinstance(parsed, dict) and "cards" in parsed:
                generated = parsed['cards']
            elif isinstance(parsed, list):
                generated = parsed
                
    except Exception as e:
        print(f"Worker Error: {e}")
        import traceback
        traceback.print_exc()
        
    return {"partial_cards": generated}

def refine_deck(state: DeckState):
    print("--- NODE: REFINER (REDUCER) ---")
    raw_cards = state['partial_cards']
    print(f"Debugging: Aggregated {len(raw_cards)} cards.")
    
    unique_map = {}
    for c in raw_cards:
        # Pydantic model dump handling
        if hasattr(c, 'model_dump'): c = c.model_dump()
        elif hasattr(c, 'dict'): c = c.dict()
        
        q = c.get('q') or c.get('Q') or c.get('question') or c.get('front')
        a = c.get('a') or c.get('A') or c.get('answer') or c.get('back')
        
        if q and isinstance(q, str):
            unique_map[q.strip()] = {"q": q, "a": a}
            
    final = list(unique_map.values())
    return {"final_cards": final}

# --- EDGE LOGIC ---

def map_jobs(state: DeckState):
    # Retrieve batches created by chunker
    batches = state.get("batches", [])
    # Create Send objects for parallel execution
    return [Send("generator", {"batch_content": b}) for b in batches]

# --- GRAPH BUILD ---

workflow = StateGraph(DeckState)
workflow.add_node("chunker", chunk_document)
workflow.add_node("generator", generate_batch_node)
workflow.add_node("refiner", refine_deck)

workflow.add_edge(START, "chunker")
workflow.add_conditional_edges("chunker", map_jobs, ["generator"])
workflow.add_edge("generator", "refiner")
workflow.add_edge("refiner", END)

app_graph = workflow.compile()
