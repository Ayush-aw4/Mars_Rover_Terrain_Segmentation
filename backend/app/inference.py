"""Semantic segmentation inference and post-processing visualization."""

import base64
import io
import time
from typing import Dict, List, Tuple

import numpy as np
import torch
from PIL import Image

from .model import ModelManager, ModelUnavailableError
from .preprocessing import MODEL_INPUT_SIZE, preprocess_image
from .schemas import AnalysisImages, AnalyzeResponse, Dimensions, TerrainClassStat

CLASS_NAMES: List[str] = ["Soil", "Bedrock", "Sand", "Big Rock"]

# Exact RGB palette from Mars_Rover.ipynb (cells 7 & 123) and Section 7 specification
CLASS_COLORS_RGB = np.array(
    [
        [164, 117, 74],   # 0: Soil
        [120, 130, 140],  # 1: Bedrock
        [238, 190, 70],   # 2: Sand
        [220, 60, 60],    # 3: Big Rock
    ],
    dtype=np.uint8,
)

# UI design-system hex colours for legend & cards
CLASS_COLORS_HEX: List[str] = ["#A87952", "#89939D", "#E6BD62", "#D95A52"]
SAND_CLASS_ID = 2
SAND_COLOR_RGB = CLASS_COLORS_RGB[SAND_CLASS_ID].astype(np.float32)


def _encode_png_data_url(rgb_array: np.ndarray) -> str:
    """Encode an HWC uint8 numpy array to a base64 PNG data URL."""
    img = Image.fromarray(rgb_array, mode="RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG", optimize=True)
    b64 = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def run_terrain_inference(model_manager: ModelManager, image_bytes: bytes) -> AnalyzeResponse:
    """
    Execute DeepLabV3+ terrain segmentation on an uploaded Mars rover image.

    Raises:
        ModelUnavailableError: if the checkpoint is not loaded.
        InvalidImageError: if image_bytes cannot be decoded.
    """
    if not model_manager.model_loaded or model_manager.model is None:
        raise ModelUnavailableError(model_manager.status_message)

    start_time = time.perf_counter()

    original_rgb, input_tensor, (orig_width, orig_height) = preprocess_image(image_bytes)
    device = model_manager.device
    input_tensor = input_tensor.to(device, non_blocking=(device.type == "cuda"))

    with torch.inference_mode():
        with torch.autocast(
            device_type="cuda",
            dtype=torch.float16,
            enabled=(device.type == "cuda"),
        ):
            logits = model_manager.model(input_tensor)
        pred_512 = torch.argmax(logits, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

    # Resize predicted class mask back to original image dimensions using NEAREST
    pred_mask_pil = Image.fromarray(pred_512, mode="L").resize(
        (orig_width, orig_height),
        resample=Image.Resampling.NEAREST,
    )
    pred_mask = np.array(pred_mask_pil, dtype=np.uint8)

    # Coloured segmentation mask
    colored_mask = CLASS_COLORS_RGB[pred_mask]

    # Terrain overlay: 0.55 * original + 0.45 * coloured mask
    orig_f32 = original_rgb.astype(np.float32)
    mask_f32 = colored_mask.astype(np.float32)
    overlay = np.clip(0.55 * orig_f32 + 0.45 * mask_f32, 0, 255).astype(np.uint8)

    # Sand-highlighted image: dim non-sand regions, highlight sand with sand colour
    sand_highlight_f32 = orig_f32 * 0.30
    sand_pixels = pred_mask == SAND_CLASS_ID
    if np.any(sand_pixels):
        sand_highlight_f32[sand_pixels] = (
            0.35 * orig_f32[sand_pixels] + 0.65 * SAND_COLOR_RGB
        )
    sand_highlight = np.clip(sand_highlight_f32, 0, 255).astype(np.uint8)

    # Pixel statistics
    total_pixels = int(orig_width * orig_height)
    counts = np.bincount(pred_mask.ravel(), minlength=len(CLASS_NAMES))

    terrain_stats: List[TerrainClassStat] = []
    for class_id, name in enumerate(CLASS_NAMES):
        count = int(counts[class_id])
        pct = round((count / total_pixels) * 100.0, 2) if total_pixels > 0 else 0.0
        terrain_stats.append(
            TerrainClassStat(
                class_id=class_id,
                name=name,
                color_rgb=CLASS_COLORS_RGB[class_id].tolist(),
                color_hex=CLASS_COLORS_HEX[class_id],
                pixel_count=count,
                percentage=pct,
            )
        )

    elapsed = round(time.perf_counter() - start_time, 3)

    return AnalyzeResponse(
        original_dimensions=Dimensions(width=orig_width, height=orig_height),
        model_input_dimensions=Dimensions(width=MODEL_INPUT_SIZE, height=MODEL_INPUT_SIZE),
        total_pixels=total_pixels,
        processing_time_seconds=elapsed,
        device=str(device),
        terrain_stats=terrain_stats,
        images=AnalysisImages(
            original=_encode_png_data_url(original_rgb),
            mask=_encode_png_data_url(colored_mask),
            overlay=_encode_png_data_url(overlay),
            sand_highlight=_encode_png_data_url(sand_highlight),
        ),
    )

