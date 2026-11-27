"""Pydantic schemas for the Mars Terrain Intelligence API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall service status: ok or degraded")
    model_loaded: bool = Field(..., description="Whether best_model.pth is loaded and ready")
    device: str = Field(..., description="Inference device (cuda or cpu)")
    cuda_available: bool
    gpu_name: Optional[str] = None
    model_path: str
    message: str


class Dimensions(BaseModel):
    width: int
    height: int


class TerrainClassStat(BaseModel):
    class_id: int
    name: str
    color_rgb: List[int]
    color_hex: str
    pixel_count: int
    percentage: float


class AnalysisImages(BaseModel):
    original: str = Field(..., description="Base64-encoded PNG data URL of original image")
    mask: str = Field(..., description="Base64-encoded PNG data URL of coloured segmentation mask")
    overlay: str = Field(..., description="Base64-encoded PNG data URL of 0.55 original + 0.45 mask")
    sand_highlight: str = Field(..., description="Base64-encoded PNG data URL with sand regions highlighted")


class AnalyzeResponse(BaseModel):
    original_dimensions: Dimensions
    model_input_dimensions: Dimensions
    total_pixels: int
    processing_time_seconds: float
    device: str
    terrain_stats: List[TerrainClassStat]
    images: AnalysisImages


class TerrainClassMetadata(BaseModel):
    class_id: int
    name: str
    color_rgb: List[int]
    color_hex: str
    description: str


class ModelInfoResponse(BaseModel):
    project_name: str
    architecture: str
    encoder: str
    pretrained_encoder_weights: str
    framework: str
    segmentation_library: str
    dataset: str
    huggingface_dataset: str
    input_resolution: str
    in_channels: int
    num_classes: int
    total_parameters: int
    model_loaded: bool
    device: str
    classes: List[TerrainClassMetadata]
    evaluation_results: Dict[str, Any]
    sand_metrics: Dict[str, Any]
    training_history: Dict[str, Any]

