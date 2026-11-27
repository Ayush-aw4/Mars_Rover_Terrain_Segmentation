"""FastAPI application entrypoint for Mars Terrain Intelligence."""

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .inference import CLASS_COLORS_HEX, CLASS_COLORS_RGB, CLASS_NAMES, run_terrain_inference
from .model import ModelManager, ModelUnavailableError
from .preprocessing import InvalidImageError
from .schemas import AnalyzeResponse, HealthResponse, ModelInfoResponse, TerrainClassMetadata

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("mars_terrain.api")

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"

DEFAULT_MODEL_PATH = BACKEND_DIR / "models" / "best_model.pth"
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH)))
if not MODEL_PATH.is_absolute():
    MODEL_PATH = BACKEND_DIR / MODEL_PATH

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

CLASS_DESCRIPTIONS = [
    "Fine-grained Martian regolith and loose dusty surface material.",
    "Consolidated rock outcrops and exposed planetary bedrock.",
    "Loose aeolian sand deposits and wind-rippled dunes posing rover slip hazards.",
    "Rocks taller than 30 cm and at least 50 cm wide posing obstacle hazards.",
]


def _load_json_artifact(filename: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    path = ARTIFACTS_DIR / filename
    if not path.exists():
        logger.warning("Artifact %s not found; using fallback.", path)
        return fallback
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning("Failed to read artifact %s: %s", path, exc)
        return fallback


model_manager = ModelManager(MODEL_PATH)
artifacts_cache: Dict[str, Dict[str, Any]] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the DeepLabV3+ model and evaluation artifacts once at startup."""
    model_manager.load()
    artifacts_cache["evaluation_results"] = _load_json_artifact("evaluation_results.json", {})
    artifacts_cache["sand_metrics"] = _load_json_artifact("sand_metrics.json", {})
    artifacts_cache["training_history"] = _load_json_artifact(
        "training_history.json", {"available": False, "epochs": []}
    )
    yield
    logger.info("Shutting down Mars Terrain Intelligence backend.")


app = FastAPI(
    title="Mars Terrain Intelligence API",
    description="Semantic segmentation backend powered by DeepLabV3+ (ResNet-50) trained on NASA JPL AI4Mars.",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
)
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def get_health() -> HealthResponse:
    """Return backend health and model checkpoint readiness."""
    return HealthResponse(
        status="ok" if model_manager.model_loaded else "degraded",
        model_loaded=model_manager.model_loaded,
        device=str(model_manager.device),
        cuda_available=model_manager.cuda_available,
        gpu_name=model_manager.gpu_name,
        model_path=str(model_manager.model_path),
        message=model_manager.status_message,
    )


@app.get("/api/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def get_model_info() -> ModelInfoResponse:
    """Return model architecture specifications and dataset-level benchmark metrics."""
    classes = [
        TerrainClassMetadata(
            class_id=i,
            name=CLASS_NAMES[i],
            color_rgb=CLASS_COLORS_RGB[i].tolist(),
            color_hex=CLASS_COLORS_HEX[i],
            description=CLASS_DESCRIPTIONS[i],
        )
        for i in range(len(CLASS_NAMES))
    ]
    return ModelInfoResponse(
        project_name="MARS TERRAIN INTELLIGENCE",
        architecture="DeepLabV3+",
        encoder="ResNet-50",
        pretrained_encoder_weights="ImageNet",
        framework="PyTorch",
        segmentation_library="segmentation-models-pytorch",
        dataset="NASA JPL AI4Mars",
        huggingface_dataset="hassanjbara/AI4MARS",
        input_resolution="512x512",
        in_channels=3,
        num_classes=4,
        total_parameters=model_manager.total_parameters,
        model_loaded=model_manager.model_loaded,
        device=str(model_manager.device),
        classes=classes,
        evaluation_results=artifacts_cache.get("evaluation_results", {}),
        sand_metrics=artifacts_cache.get("sand_metrics", {}),
        training_history=artifacts_cache.get("training_history", {"available": False, "epochs": []}),
    )


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Inference"])
async def analyze_terrain(file: UploadFile = File(...)) -> AnalyzeResponse:
    """Run semantic segmentation on an uploaded Mars rover image (JPG/JPEG/PNG)."""
    if not model_manager.model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_manager.status_message,
        )

    filename = (file.filename or "").lower()
    ext = Path(filename).suffix
    content_type = (file.content_type or "").lower()

    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension '{ext}'. Only JPG, JPEG, and PNG images are supported.",
        )

    if content_type and content_type not in ALLOWED_CONTENT_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type '{content_type}'. Only JPG, JPEG, and PNG images are supported.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB} MB.",
        )

    try:
        return run_terrain_inference(model_manager, image_bytes)
    except ModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except InvalidImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except torch.cuda.OutOfMemoryError as exc:
        logger.exception("CUDA out-of-memory during inference.")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CUDA out of memory while running segmentation inference.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during terrain inference.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {exc}",
        ) from exc

