import fitz  # PyMuPDF
import base64

def process_pdf(file_stream):
    """
    Analyzes PDF. Returns:
    {
        "mode": "text" | "image",
        "content": str (text) | List[str] (base64 images)
    }
    """
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    
    text_accumulated = ""
    images_accumulated = []
    
    # 1. Check first few pages for text density
    sample_text = ""
    for i in range(min(3, len(doc))):
        sample_text += doc[i].get_text()
        
    is_scanned = len(sample_text.strip()) < 50 # If less than 50 chars in 3 pages, it's likely scanned/image.
    
    if is_scanned:
        print("DEBUG: Scanned PDF detected. Switching to VISION mode.")
        for page in doc:
            # Render to image (72-150 dpi is usually enough for LLM, 150 is safer for handwriting)
            pix = page.get_pixmap(dpi=150) 
            data = pix.tobytes("jpeg")
            b64 = base64.b64encode(data).decode('utf-8')
            images_accumulated.append(b64)
            
        return {"mode": "image", "content": images_accumulated}
    else:
        print("DEBUG: Text PDF detected. Using TEXT mode.")
        for page in doc:
            text_accumulated += page.get_text() + "\n"
        return {"mode": "text", "content": text_accumulated}
