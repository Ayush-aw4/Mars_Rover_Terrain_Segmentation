import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Layers, ScanLine, ShieldCheck } from 'lucide-react';
import type { HealthResponse, PageTab } from '../types/api';

interface OverviewPageProps {
  onNavigate: (tab: PageTab) => void;
  health: HealthResponse | null;
}

const SUMMARY_CARDS = [
  {
    icon: Layers,
    value: '4',
    title: 'Terrain Classes',
    subtitle: 'Soil, Bedrock, Sand, Big Rock',
  },
  {
    icon: ScanLine,
    value: '512 × 512',
    title: 'Pixel-Level Analysis',
    subtitle: 'Semantic Segmentation',
  },
  {
    icon: ShieldCheck,
    value: '78.51%',
    title: 'High Accuracy',
    subtitle: 'mIoU on Expert test_min3',
  },
  {
    icon: Globe,
    value: '18,130',
    title: 'NASA AI4Mars',
    subtitle: 'Real rover imagery records',
  },
];

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, health }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl border border-[#29313D] bg-[#10141B] p-8 sm:p-12 lg:p-16">
        {/* Topographic SVG Background */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="marsGlow" cx="78%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#E87542" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#A87952" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#090B0F" stopOpacity="0" />
            </radialGradient>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#29313D" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="1200" height="600" fill="url(#gridPattern)" />
          <rect width="1200" height="600" fill="url(#marsGlow)" />
          {/* Topographic contour rings */}
          <g fill="none" stroke="#E87542" strokeWidth="0.9" strokeOpacity="0.35">
            <ellipse cx="920" cy="290" rx="140" ry="95" transform="rotate(-14 920 290)" />
            <ellipse cx="920" cy="290" rx="220" ry="150" transform="rotate(-14 920 290)" />
            <ellipse cx="920" cy="290" rx="310" ry="210" transform="rotate(-14 920 290)" />
            <ellipse cx="920" cy="290" rx="410" ry="275" transform="rotate(-14 920 290)" />
            <ellipse cx="920" cy="290" rx="520" ry="345" transform="rotate(-14 920 290)" />
          </g>
          {/* Coordinate crosshair */}
          <g stroke="#9CA3AF" strokeWidth="0.7" strokeOpacity="0.35">
            <line x1="920" y1="120" x2="920" y2="460" strokeDasharray="4 4" />
            <line x1="720" y1="290" x2="1120" y2="290" strokeDasharray="4 4" />
          </g>
        </svg>

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6 lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E87542]/30 bg-[#E87542]/10 px-3 py-1 font-mono text-xs tracking-wider text-[#E87542]">
              <span>PLANETARY SURFACE ANALYSIS</span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-[#F3F4F6] sm:text-5xl lg:text-6xl">
              See the Surface.
              <br />
              <span className="text-[#E87542]">Understand the Terrain.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-[#9CA3AF] sm:text-lg">
              AI-powered semantic segmentation for Martian terrain analysis, built using NASA JPL&apos;s
              AI4Mars dataset and a DeepLabV3+ neural network.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('analysis')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E87542] px-6 py-3 text-sm font-semibold text-[#090B0F] shadow-lg shadow-[#E87542]/20 transition-all hover:bg-[#f08353] focus:outline-none focus:ring-2 focus:ring-[#E87542]/50"
              >
                <span>Start Terrain Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('methodology')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#29313D] bg-[#151B24] px-6 py-3 text-sm font-medium text-[#F3F4F6] transition-colors hover:border-[#9CA3AF]/50 hover:bg-[#1b222e]"
              >
                <span>Learn About the Model</span>
              </button>
            </div>
          </motion.div>

          {/* Telemetry / System Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="rounded-xl border border-[#29313D] bg-[#151B24]/90 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between border-b border-[#29313D] pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-[#9CA3AF]">
                  Inference System Telemetry
                </span>
                <span
                  className={`font-mono text-xs ${
                    health?.model_loaded ? 'text-emerald-400' : 'text-[#E6BD62]'
                  }`}
                >
                  {health ? (health.model_loaded ? 'READY' : 'AWAITING WEIGHTS') : 'OFFLINE'}
                </span>
              </div>

              <dl className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Architecture</dt>
                  <dd className="text-[#F3F4F6]">DeepLabV3+ (ResNet-50)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Parameters</dt>
                  <dd className="text-[#F3F4F6]">26,678,356</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Input Resolution</dt>
                  <dd className="text-[#F3F4F6]">512 × 512 RGB</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Compute Device</dt>
                  <dd className="uppercase text-[#F3F4F6]">
                    {health ? (health.gpu_name ? `${health.device} (${health.gpu_name})` : health.device) : 'Unknown'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9CA3AF]">Dataset Source</dt>
                  <dd className="text-[#F3F4F6]">NASA JPL AI4Mars</dd>
                </div>
              </dl>

              {health && !health.model_loaded && (
                <div className="mt-4 rounded-lg border border-[#E6BD62]/30 bg-[#E6BD62]/10 p-3 text-xs leading-relaxed text-[#E6BD62]">
                  Checkpoint missing: place <code className="font-mono">best_model.pth</code> in{' '}
                  <code className="font-mono">backend/models/</code> to enable live PyTorch inference.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4 Summary Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="rounded-xl border border-[#29313D] bg-[#151B24] p-5 transition-colors hover:border-[#3A4556]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#29313D] bg-[#10141B] text-[#E87542]">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-xl font-semibold text-[#F3F4F6]">{card.value}</span>
              </div>
              <h2 className="font-display text-sm font-semibold text-[#F3F4F6]">{card.title}</h2>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">{card.subtitle}</p>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
};

