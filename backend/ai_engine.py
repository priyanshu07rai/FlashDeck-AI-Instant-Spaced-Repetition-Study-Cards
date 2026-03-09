from openai import OpenAI
import os
import json
import pypdf
from dotenv import load_dotenv, find_dotenv

# Load env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_KEY
)

def extract_text(pdf_path):
    text = ""
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            result = page.extract_text()
            if result:
                text += result + "\n"
    except Exception as e:
        print(f"PDF Error: {e}")
    return text # Return FULL text for Agent Graph

def generate_flashcards(file_path):
    # 1. Extract
    text = extract_text(file_path)
    if not text:
        return []

    # 2. Prompt
    prompt = f"""
    You are an Anki Card Generator.
    Analyze the following text and create 5-10 high-quality flashcards.
    Return ONLY a raw JSON array. No markdown formatting.
    Format:
    [
        {{"q": "Question 1", "a": "Answer 1"}},
        {{"q": "Question 2", "a": "Answer 2"}}
    ]
    
    TEXT TO ANALYZE:
    {text}
    """

    # 3. Call AI
    try:
        res = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[{"role": "user", "content": prompt}],
            extra_headers={"HTTP-Referer": "http://localhost:8501", "X-Title": "CarWorkshop"}
        )
        content = res.choices[0].message.content
        
        # Cleanup potential markdown ticks if AI misbehaves
        content = content.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Last resort cleanup
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            return json.loads(content.strip())
        
    except Exception as e:
        print(f"AI Error: {e}")
        return []
