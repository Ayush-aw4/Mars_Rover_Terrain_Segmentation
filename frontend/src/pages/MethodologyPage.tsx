import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, Database, Layers } from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'dataset',
    step: '01',
    title: 'AI4Mars Dataset',
    summary: 'NASA JPL Mars rover surface imagery (hassanjbara/AI4MARS)',
    details: [
      '18,130 original training records (16,064 labelled, 2,066 unlabelled).',
      'Split into 14,457 training images and 1,607 validation images.',
      'Four target classes: Soil (0), Bedrock (1), Sand (2), Big Rock (3; >30 cm tall, >=50 cm wide).',
      'Evaluated on expert-consensus test_min3 and test_min1 benchmarks.',
    ],
  },
  {
    id: 'preprocessing',
    step: '02',
    title: 'Preprocessing & Mask Handling',
    summary: 'Synchronized RGB resizing, masking, and ImageNet normalization',
    details: [
      'Convert rover photographs to 3-channel RGB.',
      'Apply rover and range masks during training; pixels outside valid regions use ignore label 255.',
      'Resize images to 512 × 512 with bilinear interpolation; resize masks with nearest-neighbour interpolation.',
      'Scale pixels to [0, 1] and normalize with ImageNet mean [0.485, 0.456, 0.406] and std [0.229, 0.224, 0.225].',
    ],
  },
  {
    id: 'augmentation',
    step: '03',
    title: 'Training Augmentation',
    summary: 'Synchronized Albumentations pipeline for robustness',
    details: [
      'Horizontal flip synchronized across image and segmentation mask.',
      'Random brightness and random contrast adjustments to handle Martian lighting variation.',
      'No destructive geometric warping that would distort rock/sand scale cues.',
    ],
  },
  {
    id: 'architecture',
    step: '04',
    title: 'DeepLabV3+ & ResNet-50',
    summary: 'Multi-scale Atrous Spatial Pyramid Pooling (ASPP) decoder',
    details: [
      'ResNet-50 backbone pretrained on ImageNet extracts hierarchical spatial features.',
      'ASPP module probes multi-scale context across wide sand dunes and small rocks.',
      'DeepLabV3+ decoder fuses low-level encoder features with upsampled ASPP outputs.',
      'Total trainable parameters: 26,678,356 outputting 4 semantic logits per pixel.',
    ],
  },
  {
    id: 'training',
    step: '05',
    title: 'Optimization & Training',
    summary: 'Weighted CrossEntropyLoss with FP16 mixed precision',
    details: [
      'Optimizer: AdamW with Weighted CrossEntropyLoss to counter severe class imbalance.',
      'Ignore index set to 255 for masked rover body and out-of-range regions.',
      'Batch size 4 with CUDA FP16 mixed precision (torch.autocast).',
    ],
  },
  {
    id: 'evaluation',
    step: '06',
    title: 'Expert Test Evaluation',
    summary: 'Quantitative IoU, accuracy, and sand hazard analysis',
    details: [
      'test_min3 Mean IoU: 78.51% (Pixel Accuracy: 95.95%).',
      'test_min1 Mean IoU: 64.50% (Pixel Accuracy: 90.67%).',
      'Sand error analysis across 110 sand-containing images: 98.38% recall, 90.46% precision, 89.13% IoU.',
    ],
  },
];

const ARCHITECTURE_FLOW = [
  'Image',
  'Preprocessing',
  'ResNet-50 Encoder',
  'ASPP',
  'DeepLabV3+ Decoder',
  'Four-Class Segmentation',
  'Visualization',
];

export const MethodologyPage: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>('architecture');
  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
          Methodology
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          End-to-end semantic segmentation pipeline from NASA JPL AI4Mars ingestion to DeepLabV3+ inference.
        </p>
      </div>

      {/* Architectural Flow Diagram */}
      <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Architectural Pipeline
          </h2>
          <span className="font-mono text-xs text-[#E87542]">512 × 512 → 4 Classes</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ARCHITECTURE_FLOW.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="rounded-lg border border-[#29313D] bg-[#10141B] px-3.5 py-2.5 font-mono text-xs font-medium text-[#F3F4F6]">
                {step}
              </div>
              {idx < ARCHITECTURE_FLOW.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-[#E87542]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Interactive Pipeline Stages */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          {PIPELINE_STAGES.map((stage) => {
            const active = stage.id === activeStage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-[#E87542] bg-[#E87542]/10'
                    : 'border-[#29313D] bg-[#151B24] hover:border-[#3A4556]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                    active
                      ? 'bg-[#E87542] text-[#090B0F]'
                      : 'bg-[#10141B] text-[#9CA3AF]'
                  }`}
                >
                  {stage.step}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold text-[#F3F4F6]">
                    {stage.title}
                  </div>
                  <div className="truncate text-xs text-[#9CA3AF]">{stage.summary}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-6 lg:col-span-8">
          <div className="mb-2 font-mono text-xs text-[#E87542]">STAGE {activeStage.step}</div>
          <h2 className="font-display text-xl font-bold text-[#F3F4F6]">{activeStage.title}</h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">{activeStage.summary}</p>

          <ul className="mt-5 space-y-3">
            {activeStage.details.map((detail) => (
              <li
                key={detail}
                className="flex items-start gap-3 rounded-lg border border-[#29313D] bg-[#10141B] p-3.5 text-sm text-[#F3F4F6]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E87542]" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technical Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#E87542]" />
            <h3 className="font-display text-base font-semibold text-[#F3F4F6]">
              Model Specifications
            </h3>
          </div>
          <dl className="divide-y divide-[#29313D]/60 font-mono text-xs">
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Model</dt>
              <dd className="text-[#F3F4F6]">DeepLabV3+</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Encoder</dt>
              <dd className="text-[#F3F4F6]">ResNet-50 (ImageNet)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Framework</dt>
              <dd className="text-[#F3F4F6]">PyTorch / segmentation-models-pytorch</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Input Resolution</dt>
              <dd className="text-[#F3F4F6]">512 × 512 × 3</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Output Classes</dt>
              <dd className="text-[#F3F4F6]">4 (Soil, Bedrock, Sand, Big Rock)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Parameters</dt>
              <dd className="text-[#E87542]">26,678,356</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#E6BD62]" />
            <h3 className="font-display text-base font-semibold text-[#F3F4F6]">
              Data &amp; Training Configuration
            </h3>
          </div>
          <dl className="divide-y divide-[#29313D]/60 font-mono text-xs">
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Dataset</dt>
              <dd className="text-[#F3F4F6]">NASA JPL AI4Mars (hassanjbara/AI4MARS)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Training / Validation</dt>
              <dd className="text-[#F3F4F6]">14,457 / 1,607 images</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Loss Function</dt>
              <dd className="text-[#F3F4F6]">Weighted CrossEntropyLoss (ignore=255)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Optimizer</dt>
              <dd className="text-[#F3F4F6]">AdamW</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Batch Size / Precision</dt>
              <dd className="text-[#F3F4F6]">4 / FP16 Mixed Precision</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#9CA3AF]">Augmentations</dt>
              <dd className="text-[#F3F4F6]">H-Flip, Brightness, Contrast</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Prototype Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-[#29313D] bg-[#10141B] p-4 text-xs text-[#9CA3AF]">
        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
        <p>
          <span className="font-medium text-[#F3F4F6]">Research Prototype Notice:</span> This system
          is an AI/ML research and educational prototype trained on AI4Mars and is not a flight-certified
          autonomous rover navigation system.
        </p>
      </div>
    </div>
  );
};
