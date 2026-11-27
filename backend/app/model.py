"""DeepLabV3+ model initialization and checkpoint management."""

import logging
from pathlib import Path
from typing import Optional

import segmentation_models_pytorch as smp
import torch

logger = logging.getLogger("mars_terrain.model")

EXPECTED_PARAM_COUNT = 26_678_356


class ModelUnavailableError(RuntimeError):
    """Raised when inference is requested but the trained checkpoint is not loaded."""


class ModelManager:
    """Loads and holds the single DeepLabV3+ ResNet-50 model instance."""

    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[torch.nn.Module] = None
        self.model_loaded: bool = False
        self.total_parameters: int = 0
        self.status_message: str = "Model not initialized."

    def load(self) -> None:
        """Build the DeepLabV3+ architecture and strictly load best_model.pth."""
        logger.info("Initializing DeepLabV3+ (ResNet-50, 4 classes) on device=%s", self.device)
        model = smp.DeepLabV3Plus(
            encoder_name="resnet50",
            encoder_weights=None,
            in_channels=3,
            classes=4,
            activation=None,
        )

        self.total_parameters = sum(p.numel() for p in model.parameters())
        if self.total_parameters != EXPECTED_PARAM_COUNT:
            raise RuntimeError(
                f"Unexpected parameter count: {self.total_parameters:,} "
                f"(expected {EXPECTED_PARAM_COUNT:,})"
            )

        if not self.model_path.exists():
            self.model = None
            self.model_loaded = False
            self.status_message = (
                f"Model checkpoint not found at '{self.model_path}'. "
                "Place your trained best_model.pth (~102 MB raw PyTorch state_dict) "
                "at backend/models/best_model.pth and restart the backend."
            )
            logger.warning(self.status_message)
            return

        try:
            checkpoint = torch.load(
                self.model_path,
                map_location="cpu",
                weights_only=True,
            )
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                raise ValueError(
                    "Detected a full training checkpoint dictionary ('model_state_dict' key). "
                    "Please provide the raw state_dict file 'best_model.pth' instead of 'latest_checkpoint.pth'."
                )

            model.load_state_dict(checkpoint, strict=True)
            model = model.to(self.device)
            model.eval()

            self.model = model
            self.model_loaded = True
            self.status_message = (
                f"DeepLabV3+ ResNet-50 loaded successfully ({self.total_parameters:,} parameters) "
                f"on {self.device}."
            )
            logger.info(self.status_message)
        except Exception as exc:
            self.model = None
            self.model_loaded = False
            self.status_message = f"Failed to load checkpoint '{self.model_path}': {exc}"
            logger.exception(self.status_message)

    @property
    def cuda_available(self) -> bool:
        return torch.cuda.is_available()

    @property
    def gpu_name(self) -> Optional[str]:
        if torch.cuda.is_available():
            return torch.cuda.get_device_name(0)
        return None

