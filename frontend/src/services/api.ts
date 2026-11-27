import JSZip from 'jszip';
import type { AnalyzeResponse, HealthResponse, ModelInfoResponse } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') {
        detail = data.detail;
      }
    } catch {
      // ignore non-JSON error body
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
  });
  return handleResponse<HealthResponse>(response);
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const response = await fetch(`${API_BASE_URL}/api/model-info`, {
    method: 'GET',
  });
  return handleResponse<ModelInfoResponse>(response);
}

export async function analyzeTerrainImage(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Do NOT manually set multipart Content-Type header when sending FormData
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<AnalyzeResponse>(response);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function downloadAllResultsZip(
  result: AnalyzeResponse,
  baseFilename: string
): Promise<void> {
  const zip = new JSZip();
  const cleanName = baseFilename.replace(/\.[^/.]+$/, '') || 'mars_terrain';

  zip.file(`${cleanName}_original.png`, dataUrlToUint8Array(result.images.original));
  zip.file(`${cleanName}_segmentation_mask.png`, dataUrlToUint8Array(result.images.mask));
  zip.file(`${cleanName}_terrain_overlay.png`, dataUrlToUint8Array(result.images.overlay));
  zip.file(`${cleanName}_sand_highlight.png`, dataUrlToUint8Array(result.images.sand_highlight));

  const summary = {
    original_dimensions: result.original_dimensions,
    model_input_dimensions: result.model_input_dimensions,
    total_pixels: result.total_pixels,
    processing_time_seconds: result.processing_time_seconds,
    device: result.device,
    predicted_terrain_coverage: result.terrain_stats,
  };
  zip.file(`${cleanName}_analysis_summary.json`, JSON.stringify(summary, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanName}_terrain_analysis.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

