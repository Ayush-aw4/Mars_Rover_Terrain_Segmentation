import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  Download,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Scan,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { TerrainLegend } from '../components/TerrainLegend';
import {
  analyzeTerrainImage,
  ApiError,
  downloadAllResultsZip,
  downloadDataUrl,
} from '../services/api';
import type { AnalyzeResponse, HealthResponse, VisualizationTab } from '../types/api';

interface TerrainAnalysisPageProps {
  health: HealthResponse | null;
}

const VIZ_TABS: { id: VisualizationTab; label: string }[] = [
  { id: 'original', label: 'Original Image' },
  { id: 'mask', label: 'Segmentation Mask' },
  { id: 'overlay', label: 'Terrain Overlay' },
  { id: 'sand_highlight', label: 'Sand Highlight' },
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const TerrainAnalysisPage: React.FC<TerrainAnalysisPageProps> = ({ health }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [activeVizTab, setActiveVizTab] = useState<VisualizationTab>('overlay');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFileSelected = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase()) && !/\.(jpe?g|png)$/i.test(file.name)) {
      setError('Unsupported format. Please upload a JPG, JPEG, or PNG Mars rover image.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image exceeds the 20 MB maximum upload limit.');
      return;
    }

    setSelectedFile(file);
    setResult(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.onload = () => {
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelected(file);
      }
    },
    [handleFileSelected]
  );

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreviewDims(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsAnalyzing(true);
    try {
      const response = await analyzeTerrainImage(selectedFile);
      setResult(response);
      setActiveVizTab('overlay');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(`Cannot reach FastAPI backend: ${err.message}`);
      } else {
        setError('An unexpected error occurred during terrain analysis.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadCurrent = () => {
    if (!result || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '') || 'mars_terrain';
    const dataUrl = result.images[activeVizTab];
    downloadDataUrl(dataUrl, `${baseName}_${activeVizTab}.png`);
  };

  const handleDownloadZip = async () => {
    if (!result || !selectedFile) return;
    setIsZipping(true);
    try {
      await downloadAllResultsZip(result, selectedFile.name);
    } finally {
      setIsZipping(false);
    }
  };

  const activeImageSrc = result ? result.images[activeVizTab] : previewUrl;
  const modelUnavailable = health !== null && !health.model_loaded;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
            Terrain Analysis
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Upload a Mars rover photograph to run DeepLabV3+ semantic segmentation and surface coverage analysis.
          </p>
        </div>
        <TerrainLegend compact />
      </div>

      {/* Model / Backend Warning Banner */}
      {health === null && (
        <div className="flex items-start gap-3 rounded-xl border border-[#D95A52]/40 bg-[#D95A52]/10 p-4 text-sm text-[#F3F4F6]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D95A52]" />
          <div>
            <p className="font-medium">FastAPI backend is disconnected</p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Start the Python server on <code className="font-mono">http://localhost:8000</code> to run real PyTorch inference.
            </p>
          </div>
        </div>
      )}

      {modelUnavailable && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E6BD62]/40 bg-[#E6BD62]/10 p-4 text-sm text-[#F3F4F6]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E6BD62]" />
          <div>
            <p className="font-medium text-[#E6BD62]">Trained model checkpoint not found</p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">{health.message}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-[#D95A52]/50 bg-[#D95A52]/15 p-4 text-sm text-[#F3F4F6]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D95A52]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#9CA3AF] hover:text-[#F3F4F6]"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Upload + Predicted Terrain Coverage */}
        <div className="space-y-6 lg:col-span-4">
          {/* Upload Card */}
          <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-[#E87542] bg-[#E87542]/10'
                  : 'border-[#29313D] bg-[#10141B] hover:border-[#E87542]/60'
              }`}
            >
              <Upload className="mb-3 h-7 w-7 text-[#9CA3AF]" />
              <p className="text-sm font-medium text-[#F3F4F6]">
                Drag &amp; drop a Mars rover image
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">or click to browse (JPG, JPEG, PNG)</p>
            </div>

            {/* Selected File Preview Bar */}
            {selectedFile && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#29313D] bg-[#10141B] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Uploaded rover thumbnail"
                      className="h-11 w-11 shrink-0 rounded border border-[#29313D] object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#F3F4F6]">{selectedFile.name}</p>
                    <p className="font-mono text-[11px] text-[#9CA3AF]">
                      {previewDims ? `${previewDims.width} × ${previewDims.height} · ` : ''}
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Replace image"
                    className="rounded p-1.5 text-[#9CA3AF] hover:bg-[#151B24] hover:text-[#F3F4F6]"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Remove image & clear analysis"
                    className="rounded p-1.5 text-[#9CA3AF] hover:bg-[#D95A52]/10 hover:text-[#D95A52]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={!selectedFile || isAnalyzing}
                onClick={handleAnalyze}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#E87542] px-4 py-2.5 text-sm font-semibold tracking-wide text-[#090B0F] transition-all hover:bg-[#f08353] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>ANALYSING...</span>
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4" />
                    <span>ANALYSE TERRAIN</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-[#29313D] bg-[#10141B] px-3 py-2.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Predicted Terrain Coverage Cards */}
          <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#F3F4F6]">
                Predicted Terrain Coverage
              </h2>
              <span className="font-mono text-[11px] text-[#9CA3AF]">Pixel distribution</span>
            </div>

            {isAnalyzing ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[#10141B]" />
                ))}
              </div>
            ) : result ? (
              <div className="space-y-3">
                {result.terrain_stats.map((stat) => (
                  <motion.div
                    key={stat.class_id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-[#29313D] bg-[#10141B] p-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: stat.color_hex }}
                        />
                        <span className="font-medium text-[#F3F4F6]">{stat.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-[#F3F4F6]">
                        {stat.percentage.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#151B24]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, stat.percentage)}%`,
                          backgroundColor: stat.color_hex,
                        }}
                      />
                    </div>

                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-[#9CA3AF]">
                      <span>Predicted pixels</span>
                      <span>{stat.pixel_count.toLocaleString()} px</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#29313D] bg-[#10141B] p-6 text-center text-xs text-[#9CA3AF]">
                Run terrain analysis on an uploaded Mars rover image to compute actual pixel-level coverage.
              </div>
            )}
          </div>
        </div>

        {/* Right Main Area: Visualization Tabs + Metadata + Downloads */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
            {/* Tabs & Fullscreen */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#29313D] pb-3">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {VIZ_TABS.map((tab) => {
                  const disabled = !result && tab.id !== 'original';
                  const active = activeVizTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={disabled}
                      onClick={() => setActiveVizTab(tab.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#E87542] text-[#090B0F]'
                          : 'bg-[#10141B] text-[#9CA3AF] hover:text-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeImageSrc && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#29313D] bg-[#10141B] px-2.5 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6]"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Expand</span>
                </button>
              )}
            </div>

            {/* Image Viewport */}
            <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-lg border border-[#29313D] bg-[#090B0F] p-2">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#29313D] border-t-[#E87542]" />
                  <p className="font-mono text-xs text-[#9CA3AF]">
                    Running DeepLabV3+ inference at 512 × 512...
                  </p>
                </div>
              ) : activeImageSrc ? (
                <img
                  src={activeImageSrc}
                  alt={`Mars terrain ${activeVizTab}`}
                  className="max-h-[520px] w-auto max-w-full rounded object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <ImageIcon className="h-10 w-10 text-[#29313D]" />
                  <p className="text-sm font-medium text-[#9CA3AF]">No rover image selected</p>
                  <p className="max-w-xs text-xs text-[#9CA3AF]/70">
                    Upload a Martian surface photograph on the left to inspect its segmentation mask, overlay, and sand hazard highlight.
                  </p>
                </div>
              )}
            </div>

            {/* Analysis Details & Download Actions */}
            {result && (
              <div className="mt-5 grid gap-4 border-t border-[#29313D] pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
                  <div className="text-[11px] text-[#9CA3AF]">Original Resolution</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#F3F4F6]">
                    {result.original_dimensions.width} × {result.original_dimensions.height}
                  </div>
                </div>
                <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
                  <div className="text-[11px] text-[#9CA3AF]">Model Input</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#F3F4F6]">
                    {result.model_input_dimensions.width} × {result.model_input_dimensions.height}
                  </div>
                </div>
                <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
                  <div className="text-[11px] text-[#9CA3AF]">Total Pixels Analysed</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#F3F4F6]">
                    {result.total_pixels.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
                  <div className="text-[11px] text-[#9CA3AF]">Processing Time</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#E87542]">
                    {result.processing_time_seconds.toFixed(3)} s
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCurrent}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#29313D] bg-[#10141B] px-3.5 py-2 text-xs font-medium text-[#F3F4F6] hover:border-[#E87542]/60"
                  >
                    <Download className="h-3.5 w-3.5 text-[#E87542]" />
                    <span>Download Active View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedFile &&
                      downloadDataUrl(
                        result.images.mask,
                        `${selectedFile.name.replace(/\.[^/.]+$/, '')}_mask.png`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#29313D] bg-[#10141B] px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Mask</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedFile &&
                      downloadDataUrl(
                        result.images.overlay,
                        `${selectedFile.name.replace(/\.[^/.]+$/, '')}_overlay.png`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#29313D] bg-[#10141B] px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Overlay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedFile &&
                      downloadDataUrl(
                        result.images.sand_highlight,
                        `${selectedFile.name.replace(/\.[^/.]+$/, '')}_sand_highlight.png`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#29313D] bg-[#10141B] px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Sand Highlight</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isZipping}
                  onClick={handleDownloadZip}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#E87542]/15 px-4 py-2 text-xs font-semibold text-[#E87542] ring-1 ring-[#E87542]/40 hover:bg-[#E87542]/25"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>{isZipping ? 'Packaging ZIP...' : 'Download All (ZIP)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && activeImageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-6 top-6 rounded-full border border-[#29313D] bg-[#151B24] p-2 text-[#F3F4F6] hover:bg-[#29313D]"
            aria-label="Close fullscreen view"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={activeImageSrc}
            alt="Fullscreen Mars terrain visualization"
            className="max-h-[90vh] max-w-[92vw] rounded-lg border border-[#29313D] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

