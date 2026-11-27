# MARS TERRAIN INTELLIGENCE

**Planetary Surface Analysis System** — An AI-powered Martian terrain semantic segmentation platform built with a **DeepLabV3+ (ResNet-50)** model trained on **NASA JPL's AI4Mars** dataset, served via a **FastAPI + PyTorch** backend and a **React + TypeScript + Tailwind CSS** interface.

> **Research Prototype Disclaimer:** This application is a research and educational prototype. It is not a flight-certified or validated autonomous Mars rover navigation system.

---

## 1. Project Overview & Problem Statement

A Mars rover must continuously evaluate surrounding surface terrain to plan safe traverses and avoid mobility hazards such as loose aeolian sand traps or large boulders. **Mars Terrain Intelligence** performs pixel-level semantic segmentation on Mars rover imagery, classifying every pixel into one of four terrain categories:

| Class ID | Terrain Class | Description | Visualization Colour |
| :---: | :--- | :--- | :--- |
| `0` | **Soil** | Martian regolith and fine dusty surface material | `#A87952` (`[164, 117, 74]`) |
| `1` | **Bedrock** | Consolidated rock outcrops and exposed bedrock | `#89939D` (`[120, 130, 140]`) |
| `2` | **Sand** | Loose aeolian sand deposits & slip hazards | `#E6BD62` (`[238, 190, 70]`) |
| `3` | **Big Rock** | Rocks taller than 30 cm and at least 50 cm wide | `#D95A52` (`[220, 60, 60]`) |

---

## 2. Dataset & Training Configuration

- **Dataset:** NASA JPL AI4Mars (`hassanjbara/AI4MARS` on Hugging Face)
- **Dataset Split:** 18,130 original records (16,064 labelled, 2,066 unlabelled) → **14,457 training** / **1,607 validation** images
- **Preprocessing:**
  - Convert to RGB
  - Apply rover and range masks (ignore label `255`)
  - Resize images to **512 × 512** (bilinear) and masks (nearest-neighbour)
  - Scale to `[0, 1]` and normalize with ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`
- **Training Augmentation:** Horizontal flip, random brightness, random contrast
- **Architecture:** `DeepLabV3+` (`segmentation-models-pytorch`) with ImageNet-pretrained `ResNet-50` encoder (`26,678,356` parameters)
- **Optimization:** `AdamW`, Weighted `CrossEntropyLoss` (`ignore_index=255`), batch size `4`, FP16 mixed precision

---

## 3. Model Evaluation Benchmarks

> **Note:** The metrics below are dataset-level expert test-set benchmarks, not confidence scores for individual uploaded images.

### Summary Metrics

| Split | Mean IoU | Pixel Accuracy | All-Soil Baseline mIoU |
| :--- | :---: | :---: | :---: |
| **Validation** | 79.75% | 95.32% | — |
| **Expert `test_min3`** | **78.51%** | **95.95%** | 12.84% |
| **Expert `test_min1`** | **64.50%** | **90.67%** | 11.47% |

### Class-Wise IoU

| Terrain Class | `test_min3` IoU | `test_min1` IoU |
| :--- | :---: | :---: |
| **Soil** | 93.50% | 87.86% |
| **Bedrock** | 93.62% | 79.73% |
| **Sand** | 89.13% | 80.65% |
| **Big Rock** | 37.80% | 9.74% |

### Sand Error Analysis (`test_min3`, 110 images containing sand)

- **Precision:** 90.46%
- **Recall:** 98.38%
- **Sand IoU:** 89.13%
- **True Positives:** 7,534,904 px | **False Positives:** 794,796 px | **False Negatives:** 124,416 px

---

## 4. Technology Stack

- **Backend:** Python, FastAPI, PyTorch, `segmentation-models-pytorch`, Pillow, NumPy
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, JSZip

---

## 5. Setup & Running Locally

### Model Checkpoint Setup

Trained model weights are not stored in GitHub. Download your trained `best_model.pth` (~102 MB raw PyTorch `state_dict`) from Google Drive:
`MyDrive/Mars_Rover_Project/checkpoints/best_model.pth`
and place it at:
`backend/models/best_model.pth`

*(If `best_model.pth` is missing, the backend starts in `degraded` mode and returns HTTP `503` on `/api/analyze` rather than fabricating predictions.)*

### Backend Startup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Startup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 6. API Reference

- `GET /api/health` — Returns backend readiness, `model_loaded` flag, CUDA/CPU device status, and checkpoint path.
- `GET /api/model-info` — Returns architecture specs, class definitions, and dataset-level benchmark artifacts.
- `POST /api/analyze` — Accepts `multipart/form-data` with `file` (`JPG`/`JPEG`/`PNG`, max 20 MB). Returns original/mask/overlay/sand-highlight PNGs, pixel counts, percentages, and processing time.

