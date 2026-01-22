import base64
import json
import easyocr
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. Initialize Multiple Specialized Readers
# ==========================================
print("⏳ Loading AI Models... (This process happens only once)")

# Reader 1: Latin scripts (English + Malay)
print("   • Loading Latin/Malay model...")
reader_latin = easyocr.Reader(['en', 'ms'], gpu=False)

# Reader 2: Japanese
print("   • Loading Japanese model...")
reader_japanese = easyocr.Reader(['ja', 'en'], gpu=False)

# Reader 3: Korean
print("   • Loading Korean model...")
reader_korean = easyocr.Reader(['ko', 'en'], gpu=False)

# Reader 4: Thai
print("   • Loading Thai model...")
reader_thai = easyocr.Reader(['th', 'en'], gpu=False)

# Reader 5: Chinese Simplified
print("   • Loading Chinese model...")
reader_chinese = easyocr.Reader(['ch_sim', 'en'], gpu=False)

print("✅ All AI Models Loaded Successfully!")

def load_dataset():
    try:
        with open('ingredients.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"haram_ingredients": [], "mushbooh_ingredients": []}

ingredients_data = load_dataset()

@app.route('/check-ingredients', methods=['POST'])
def check_ingredients():
    data = request.json
    
    image_data = data.get('image', '')
    manual_text = data.get('text', '')
    region = data.get('region', 'ALL') 
    
    scanned_text = ""

    try:
        # CASE A: Image Processing (OCR)
        if image_data:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))

            # 1. Resize (Keep this speed fix!)
            if image.width > 1000:
                print(f"📉 Resizing image from {image.width}px to 1000px...")
                ratio = 1000 / float(image.width)
                new_height = int((float(image.height) * float(ratio)))
                image = image.resize((1000, new_height), Image.Resampling.LANCZOS)

            # 2. Convert to Numpy
            image_np = np.array(image)

            print(f"🤖 Scanning image (Mode: {region})...")
            
            # 3. SELECTIVE SCANNING LOGIC (The new "Targeted" Speed Fix)
            found_texts = []
            
            # === BASE LAYER: Always scan English/Malay ===
            # (Because ingredients often mix English E-numbers with local text)
            print("   • Running Latin/Malay model...")
            found_texts += reader_latin.readtext(image_np, detail=0)

            # === TARGET LAYER: Add only the requested language ===
            if region == 'JAPAN' or region == 'ALL':
                print("   • Running Japanese model...")
                found_texts += reader_japanese.readtext(image_np, detail=0)

            if region == 'KOREA' or region == 'ALL':
                print("   • Running Korean model...")
                found_texts += reader_korean.readtext(image_np, detail=0)
            
            if region == 'THAI' or region == 'ALL':
                print("   • Running Thai model...")
                found_texts += reader_thai.readtext(image_np, detail=0)

            if region == 'CHINA' or region == 'ALL':
                print("   • Running Chinese model...")
                found_texts += reader_chinese.readtext(image_np, detail=0)
            
            # Combine results
            combined_text_list = list(set(found_texts))
            scanned_text = " ".join(combined_text_list).lower()
            print(f"📄 Found Text: {scanned_text[:100]}...") 

        # CASE B: Manual Text Input
        elif manual_text:
            scanned_text = manual_text.lower()
            print(f"⌨️  Manual Input: {scanned_text}")

        # CASE C: No Valid Data
        else:
            return jsonify({"status": "Error", "reason": "No image or text sent", "color": "grey"})

        # ==========================================
        # 4. Analyze Ingredients
        # ==========================================
        found_haram = []
        found_mushbooh = []

        # Check Haram
        for item in ingredients_data['haram_ingredients']:
            english_name = item['names'][0].capitalize()
            reason = item['reason']
            for name in item['names']:
                if name.lower() in scanned_text:
                    formatted = f"• {english_name} (found: '{name}')\n   Why: {reason}"
                    if formatted not in found_haram: found_haram.append(formatted)
                    break 

        # Check Mushbooh
        for item in ingredients_data['mushbooh_ingredients']:
            english_name = item['names'][0].capitalize()
            reason = item['reason']
            for name in item['names']:
                if name.lower() in scanned_text:
                    formatted = f"• {english_name} (found: '{name}')\n   Why: {reason}"
                    if formatted not in found_mushbooh: found_mushbooh.append(formatted)
                    break

        # Return Results
        if found_haram:
            return jsonify({
                "status": "Haram",
                "reason": "\n\n".join(found_haram),
                "color": "#FF4D4D"
            })
        elif found_mushbooh:
            return jsonify({
                "status": "Mushbooh",
                "reason": "\n\n".join(found_mushbooh),
                "color": "#FFA500"
            })
        
        return jsonify({
            "status": "Halal",
            "reason": "Safe to consume. No haram ingredients found.",
            "color": "#4CAF50"
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"status": "Error", "reason": "Failed to process request.", "color": "grey"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)