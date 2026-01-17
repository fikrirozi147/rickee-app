# Rickee: AI-Powered Halal Ingredient Verifier 📱🔍

> A cross-platform mobile application that utilizes Machine Learning (OCR) to scan food packaging in 5+ languages and verify Halal compliance in real-time.

![Project Banner](https://via.placeholder.com/800x400?text=Rickee+App+Demo+Coming+Soon)
## 🚀 Overview
Traveling Muslims often struggle to identify non-Halal ingredients (e.g., "Shortening", "Mirin", "E471") in foreign countries where packaging uses complex scripts like Kanji or Hangul. 

**Rickee** solves this by combining a **React Native** mobile interface with a **Python/Flask** backend running **5 specialized Neural Networks** to detect prohibited ingredients in English, Malay, Japanese, Korean, Thai, and Chinese.

## ✨ Key Features
* **📸 AI Camera Scan:** Instantly extracts text from product packaging using Optical Character Recognition (EasyOCR).
* **🌍 Multi-Language Support:** Detects ingredients in **Latin** (EN/MS), **Japanese** (Kanji/Kana), **Korean** (Hangul), **Thai**, and **Chinese**.
* **⚡ Region-Based Optimization:** Custom "Region Chips" allow users to select specific language models, reducing processing time by **90%** (from ~3 mins to <20s).
* **⌨️ Manual Search:** Quick fallback mode to type and check specific E-numbers or keywords.
* **🛡️ Educational Feedback:** Doesn't just say "Haram"—explains *why* (e.g., "Contains Mirin: Japanese Rice Wine").

## 🛠️ Tech Stack

### Frontend (Mobile)
* **Framework:** React Native (Expo)
* **Language:** TypeScript
* **Camera:** Expo Camera
* **UI:** Custom Components & Modals

### Backend (API & ML)
* **Server:** Python (Flask)
* **Machine Learning:** EasyOCR (PyTorch backend)
* **Data Processing:** NumPy, Pillow (PIL)
* **Architecture:** REST API with Base64 Image Processing

## 🧠 Engineering Highlights
**Problem:** Running 5 simultaneous OCR models on high-resolution smartphone images (12MP) caused server timeouts (3+ minutes per scan).

**Solution:**
1.  **Image Pipeline Optimization:** Implemented server-side resizing (Lanczos resampling) to downscale images to ~1000px width, maintaining text clarity while reducing file size by 95%.
2.  **Selective Model Loading:** engineered a "Region Selector" feature. Instead of running all 5 AI models for every request, the backend dynamically activates only the relevant neural networks (e.g., "Asia Mode" runs only JP/KR/TH models), drastically reducing CPU load and latency.

## 🏃‍♂️ How to Run

### 1. Backend (Python)
```bash
cd halal-checker-backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt
python app.py
```

### 2. Frontend (React Native)
```bash
cd rickee-app
npm install
npx expo start
```

## 🔮 Future Improvements
* **Offline Mode:** Porting lightweight OCR models (Tesseract) to run directly on the mobile device.

* **Community Database:** Allow users to submit new Halal/Haram findings to improve the dataset.

* **Barcode Scanning:** Integration with OpenFoodFacts API.

### Built with ❤️ by Fikri Rozi