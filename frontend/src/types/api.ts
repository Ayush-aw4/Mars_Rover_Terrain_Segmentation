export type PageTab = 'overview' | 'analysis' | 'performance' | 'methodology';

export type VisualizationTab = 'original' | 'mask' | 'overlay' | 'sand_highlight';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  model_loaded: boolean;
  device: string;
  cuda_available: boolean;
  gpu_name: string | null;
  model_path: string;
  message: string;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface TerrainClassStat {
  class_id: number;
  name: string;
  color_rgb: number[];
  color_hex: string;
  pixel_count: number;
  percentage: number;
}

export interface AnalysisImages {
  original: string;
  mask: string;
  overlay: string;
  sand_highlight: string;
}

export interface AnalyzeResponse {
  original_dimensions: Dimensions;
  model_input_dimensions: Dimensions;
  total_pixels: number;
  processing_time_seconds: number;
  device: string;
  terrain_stats: TerrainClassStat[];
  images: AnalysisImages;
}

export interface TerrainClassMetadata {
  class_id: number;
  name: string;
  color_rgb: number[];
  color_hex: string;
  description: string;
}

export interface EvaluationSplit {
  iou: number[];
  mean_iou: number;
  pixel_accuracy: number;
  baseline_miou: number;
}

export interface EvaluationResults {
  model?: string;
  encoder?: string;
  input_resolution?: string;
  classes?: string[];
  validation?: {
    mean_iou: number;
    pixel_accuracy: number;
  };
  test_min3?: EvaluationSplit;
  test_min1?: EvaluationSplit;
}

export interface SandMetrics {
  class?: string;
  class_id?: number;
  dataset_split?: string;
  precision?: number;
  recall?: number;
  iou?: number;
  true_positives?: number;
  false_positives?: number;
  false_negatives?: number;
  images_containing_sand?: number;
}

export interface TrainingEpoch {
  epoch: number;
  train_loss?: number | null;
  val_loss?: number | null;
  val_miou?: number | null;
  val_accuracy?: number | null;
}

export interface TrainingHistory {
  available: boolean;
  note?: string;
  epochs: TrainingEpoch[];
}

export interface ModelInfoResponse {
  project_name: string;
  architecture: string;
  encoder: string;
  pretrained_encoder_weights: string;
  framework: string;
  segmentation_library: string;
  dataset: string;
  huggingface_dataset: string;
  input_resolution: string;
  in_channels: number;
  num_classes: number;
  total_parameters: number;
  model_loaded: boolean;
  device: string;
  classes: TerrainClassMetadata[];
  evaluation_results: EvaluationResults;
  sand_metrics: SandMetrics;
  training_history: TrainingHistory;
}

