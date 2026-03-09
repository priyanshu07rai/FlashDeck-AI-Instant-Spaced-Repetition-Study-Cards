import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    print("1. Importing agent_graph...")
    from backend.agent_graph import app_graph
    print("   Success.")
    
    print("2. Testing with Dummy Text Input...")
    try:
        inputs = {
            "original_text": "This is a test document about Machine Learning. It talks about Supervised and Unsupervised learning.",
            "batches": [], # Initialize empty
            "partial_cards": [],
            "final_cards": []
        }
        print("   Invoking graph...")
        result = app_graph.invoke(inputs)
        print("   Success!")
        print(f"   Generated Cards: {result.get('final_cards')}")
        
    except Exception as e:
        print(f"   CRASH DURING INVOKE: {e}")
        import traceback
        traceback.print_exc()

except Exception as e:
    print(f"CRASH DURING IMPORT: {e}")
    import traceback
    traceback.print_exc()
