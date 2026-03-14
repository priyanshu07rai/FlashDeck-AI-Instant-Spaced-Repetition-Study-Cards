from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ai_engine import extract_text
from deck_builder import create_anki_deck
from pydantic import BaseModel
import shutil
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="FlashDeck AI API")

# --- IN-MEMORY STORAGE ---
DOCUMENT_STORE = {"latest": None, "mode": None}

class ChatRequest(BaseModel):
    question: str


# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # More permissive for easier deployment initially
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend Static Files
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude API routes from catch-all
        if full_path.startswith("generate") or full_path.startswith("chat") or full_path == "":
            if full_path == "":
                return FileResponse(os.path.join(frontend_dist, "index.html"))
            return None # Proceed to next handler

        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    print(f"WARNING: Frontend dist not found at {frontend_dist}")

@app.get("/")
def home():
    return {"status": "FlashDeck Brain is Online 🧠"}

@app.post("/generate")
async def generate_deck(file: UploadFile = File(...)):
    safe_filename = str(file.filename).encode('ascii', 'ignore').decode('ascii')
    print(f"Processing {safe_filename}...")
    
    try:
        # 1. Simple Text Extraction
        from vision_engine import process_pdf
        
        await file.seek(0)
        try:
            result_payload = process_pdf(file.file)
            content = result_payload["content"]
            mode = result_payload["mode"]
            
        except Exception as e:
            print(f"Processing Error: {e}")
            raise HTTPException(status_code=400, detail=f"PDF Read Failed: {e}")
            
        if not content:
             print("Content empty.")
             raise HTTPException(status_code=400, detail="Could not extract content.")

        print(f"Processed Document. Mode: {mode}. Content Size: {len(content)}")

        # SAVE CONTEXT FOR CHAT
        global DOCUMENT_STORE
        DOCUMENT_STORE["latest"] = content
        DOCUMENT_STORE["mode"] = mode
        print(f"Context saved to memory (Mode: {mode})")

        # 2. SIMPLIFIED: Direct LLM Call (bypass complex graph for now)
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage
        import json
        from dotenv import load_dotenv
        
        load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
        llm = ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="google/gemini-2.0-flash-001"
        )
        
        cards = []
        
        try:
            if mode == "text":
                # Simple text flashcard generation
                text_content = str(content)[:50000]  # Limit to avoid token overflow
                prompt = f"""Create 15-20 high-quality flashcards from this text.
                
Return ONLY a JSON array in this exact format:
[
  {{"q": "Question 1", "a": "Answer 1"}},
  {{"q": "Question 2", "a": "Answer 2"}}
]

TEXT:
{text_content}"""
                
                msg = HumanMessage(content=prompt)
                res = llm.invoke([msg])
                
                # Clean and parse response
                response_text = res.content.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[-1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[-1].split("```")[0]
                response_text = response_text.strip()
                
                parsed = json.loads(response_text)
                if isinstance(parsed, list):
                    cards = [{"q": c.get("q", ""), "a": c.get("a", "")} for c in parsed]
                elif isinstance(parsed, dict) and "cards" in parsed:
                    cards = parsed["cards"]
                    
            else:  # image mode
                # Take first 10 pages to avoid overwhelming the model
                images = content[:10] if len(content) > 10 else content
                
                content_parts = [
                    {"type": "text", "text": "Create 15-20 flashcards from these document pages. Return ONLY a JSON array: [{\"q\": \"...\", \"a\": \"...\"}]"}
                ]
                for img in images:
                    content_parts.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                    })
                
                msg = HumanMessage(content=content_parts)
                res = llm.invoke([msg])
                
                # Clean and parse
                response_text = res.content.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[-1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[-1].split("```")[0]
                response_text = response_text.strip()
                
                parsed = json.loads(response_text)
                if isinstance(parsed, list):
                    cards = [{"q": c.get("q", ""), "a": c.get("a", "")} for c in parsed]
                elif isinstance(parsed, dict) and "cards" in parsed:
                    cards = parsed["cards"]
                    
        except Exception as e:
             print(f"LLM Error: {e}")
             import traceback
             traceback.print_exc()
             raise HTTPException(status_code=500, detail=f"Card Generation Failed: {str(e)}")

        print(f"Generated {len(cards)} cards.")

        # 3. Create Anki Deck
        deck_name = file.filename.replace(".pdf", "")
        output_file = create_anki_deck(cards, deck_name=deck_name)
        
        # 4. Return Output
        return {
            "status": "success",
            "deck_name": deck_name,
            "cards": cards,
            "download_path": output_file
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_doc(req: ChatRequest):
    """
    Chat with the uploaded document using the in-memory context.
    """
    if not DOCUMENT_STORE["latest"]:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")
    
    context = DOCUMENT_STORE["latest"]
    mode = DOCUMENT_STORE["mode"]
    question = req.question
    
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from dotenv import load_dotenv
    
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model="google/gemini-2.0-flash-001"
    )
    
    try:
        if mode == "image":
            content_parts = [
                {"type": "text", "text": f"You are a helpful assistant. Answer the user's question based on these document slides.\n\nUser Question: {question}"}
            ]
            
            images = context
            if len(images) > 20: 
                images = images[:20]
            
            for img in images:
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                })
                
            msg = HumanMessage(content=content_parts)
            res = llm.invoke([msg])
            return {"answer": res.content}
            
        else:
            context_text = str(context)
            prompt = f"""
            You are a helpful assistant. Answer the question based ONLY on the provided document context.
            
            DOCUMENT CONTEXT:
            {context_text[:100000]} 
            
            USER QUESTION:
            {question}
            """
            
            msg = HumanMessage(content=prompt)
            res = llm.invoke([msg])
            return {"answer": res.content}
            
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
