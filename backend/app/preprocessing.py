"""Image decoding and preprocessing matching Mars_Rover.ipynb exactly."""

import io
from typing import Tuple

import numpy as np
import torch
from PIL import Image, UnidentifiedImageError

MODEL_INPUT_SIZE = 512
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)


class InvalidImageError(ValueError):
    """Raised when uploaded bytes cannot be decoded as a valid RGB image."""


def preprocess_image(image_bytes: bytes) -> Tuple[np.ndarray, torch.Tensor, Tuple[int, int]]:
    """
    Decode an uploaded image and preprocess it for DeepLabV3+ inference.

    Follows the exact training/inference pipeline from Mars_Rover.ipynb:
    1. Decode image and convert to RGB.
    2. Record original (width, height) dimensions.
    3. Resize to 512 x 512 using bilinear interpolation.
    4. Convert HWC uint8 -> CHW float32 scaled to [0, 1].
    5. Apply ImageNet mean/std normalization.

    Returns:
        original_rgb: Original RGB image as uint8 numpy array (H, W, 3).
        input_tensor: Normalized tensor of shape (1, 3, 512, 512).
        original_size: Tuple (width, height).
    """
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        pil_image.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImageError(f"Invalid or corrupted image file: {exc}") from exc

    rgb_image = pil_image.convert("RGB")
    original_width, original_height = rgb_image.size
    if original_width == 0 or original_height == 0:
        raise InvalidImageError("Image has zero width or height.")

    original_rgb = np.array(rgb_image, dtype=np.uint8)

    resized_pil = rgb_image.resize(
        (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE),
        resample=Image.Resampling.BILINEAR,
    )
    resized_np = np.array(resized_pil, dtype=np.uint8)

    # HWC -> CHW, scale to [0, 1], normalize with ImageNet stats
    chw = np.transpose(resized_np, (2, 0, 1)).astype(np.float32) / 255.0
    normalized = (chw - IMAGENET_MEAN) / IMAGENET_STD

    input_tensor = torch.from_numpy(normalized).unsqueeze(0).contiguous()
    return original_rgb, input_tensor, (original_width, original_height)

