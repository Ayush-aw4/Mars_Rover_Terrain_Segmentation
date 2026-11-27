# Deployment guide

## Recommended architecture

- Deploy the **React/Vite frontend** to Vercel with the project root set to `frontend`.
- Deploy the **PyTorch/FastAPI inference API** separately to a container or VM service that supports PyTorch, a persistent model file, and adequate RAM/CPU (or GPU if available).
- Set Vercel's `VITE_API_BASE_URL` environment variable to the public FastAPI URL.

## Why not put the trained PyTorch backend in a standard Vercel Function?

The trained `best_model.pth` is approximately 102 MB. Standard Vercel Function deployment bundles have a 50 MB maximum size. PyTorch and the segmentation dependency stack further increase the function bundle size and cold-start/memory requirements. The model checkpoint should not be committed to Git or bundled into the Vercel frontend/function. A remote model download at runtime would still need to fit within runtime memory and execution constraints and would add cold-start/network reliability concerns.

The repository contains an experimental Vercel Python-function adapter under `backend/api/index.py` and `backend/vercel.json`, but this does **not** solve the model artifact and dependency size constraints. Do not consider the inference API deployed until it loads the real checkpoint and passes an end-to-end inference test.

## Deploy the frontend to Vercel

1. Import `Ayush-aw4/Mars_Rover_Terrain_Segmentation` into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variable:
   - `VITE_API_BASE_URL=https://YOUR-FASTAPI-HOST`
7. Deploy and test all pages.
8. Connect only to a backend URL that has passed real inference tests.

The frontend is a static Vite build and is the part intended for Vercel.

## Deploy the FastAPI backend separately

Deploy the `backend/` folder to a Python container/VM service. Provide the model checkpoint securely at `backend/models/best_model.pth` or set `MODEL_PATH` to its mounted location. Do not commit `.pth` files.

Set environment variables:
- `MODEL_PATH`: absolute or backend-relative path to `best_model.pth`
- `MAX_UPLOAD_SIZE_MB=20`
- `CORS_ORIGINS`: comma-separated exact Vercel production/custom-domain origins
- `CORS_ORIGIN_REGEX`: optional carefully restricted preview-domain regex
- `LOG_LEVEL=INFO`

Start:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check `GET /api/health`, `GET /api/model-info`, and upload a real rover image to `POST /api/analyze`.

The API returns 503 if the actual checkpoint is missing or cannot be loaded. It never substitutes mock predictions.
