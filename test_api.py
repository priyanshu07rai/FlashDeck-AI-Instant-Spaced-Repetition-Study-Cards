import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
print(f"API Key: {api_key[:20]}...")

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

try:
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        model="google/gemini-2.0-flash-001"
    )
    
    msg = HumanMessage(content="Say 'hello' if you can hear me.")
    response = llm.invoke([msg])
    
    print(f"\n✅ SUCCESS!")
    print(f"Response: {response.content}")
    
except Exception as e:
    print(f"\n❌ FAILED!")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
