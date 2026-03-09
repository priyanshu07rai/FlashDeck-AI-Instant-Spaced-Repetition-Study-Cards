import requests
import os

# Upload a simple test PDF
pdf_path = input("Enter path to your PDF file: ")

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit(1)

print(f"Uploading {pdf_path}...")

with open(pdf_path, 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8001/generate', files=files)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"\nResponse JSON:")
    import json
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        data = response.json()
        cards = data.get('cards', [])
        print(f"\nNumber of cards: {len(cards)}")
        if len(cards) > 0:
            print(f"\nFirst card:")
            print(f"  Q: {cards[0].get('q', 'N/A')}")
            print(f"  A: {cards[0].get('a', 'N/A')}")
    else:
        print(f"\nERROR: {response.text}")
