import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import type { ModelInfoResponse } from '../types/api';

interface ModelPerformancePageProps {
  modelInfo: ModelInfoResponse | null;
}

const CLASS_IOU_DATA = [
  { name: 'Soil', test_min3: 93.50, test_min1: 87.86, color: '#A87952' },
  { name: 'Bedrock', test_min3: 93.62, test_min1: 79.73, color: '#89939D' },
  { name: 'Sand', test_min3: 89.13, test_min1: 80.65, color: '#E6BD62' },
  { name: 'Big Rock', test_min3: 37.80, test_min1: 9.74, color: '#D95A52' },
];

const BASELINE_COMPARISON_DATA = [
  { split: 'test_min3', deeplabv3plus: 78.51, baseline: 12.84 },
  { split: 'test_min1', deeplabv3plus: 64.50, baseline: 11.47 },
];

export const ModelPerformancePage: React.FC<ModelPerformancePageProps> = ({ modelInfo }) => {
  const trainingHistory = modelInfo?.training_history;
  const hasEpochs = Boolean(trainingHistory?.available && trainingHistory.epochs.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#F3F4F6] sm:text-3xl">
            Model Performance
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Dataset-level expert test-set benchmarks on NASA JPL AI4Mars.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-[#29313D] bg-[#151B24] px-3 py-1.5 text-xs text-[#9CA3AF]">
          <Info className="h-4 w-4 text-[#E87542]" />
          <span>Expert test-set benchmarks — not single-image confidence scores</span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="font-mono text-3xl font-bold text-[#F3F4F6]">78.51%</div>
          <div className="mt-1 text-xs font-medium text-[#9CA3AF]">test_min3 Mean IoU</div>
          <div className="mt-2 font-mono text-[11px] text-[#9CA3AF]">
            Validation mIoU: 79.75%
          </div>
        </div>

        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="font-mono text-3xl font-bold text-[#F3F4F6]">95.95%</div>
          <div className="mt-1 text-xs font-medium text-[#9CA3AF]">test_min3 Pixel Accuracy</div>
          <div className="mt-2 font-mono text-[11px] text-[#9CA3AF]">
            Validation Acc: 95.32%
          </div>
        </div>

        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="font-mono text-3xl font-bold text-[#E6BD62]">89.13%</div>
          <div className="mt-1 text-xs font-medium text-[#9CA3AF]">Sand IoU (test_min3)</div>
          <div className="mt-2 font-mono text-[11px] text-[#9CA3AF]">
            Recall: 98.38% · Precision: 90.46%
          </div>
        </div>

        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
          <div className="font-mono text-3xl font-bold text-[#E87542]">+65.67 pp</div>
          <div className="mt-1 text-xs font-medium text-[#9CA3AF]">vs All-Soil Baseline</div>
          <div className="mt-2 font-mono text-[11px] text-[#9CA3AF]">
            Baseline test_min3 mIoU: 12.84%
          </div>
        </div>
      </div>

      {/* Charts & Tables Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Class-wise IoU Chart */}
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#F3F4F6]">
              Class-Wise IoU (test_min3 vs test_min1)
            </h2>
            <span className="font-mono text-xs text-[#9CA3AF]">% IoU</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLASS_IOU_DATA} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29313D" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10141B',
                    borderColor: '#29313D',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="test_min3" name="test_min3 IoU (%)" radius={[4, 4, 0, 0]}>
                  {CLASS_IOU_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="test_min1" name="test_min1 IoU (%)" fill="#4B5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Results Table */}
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5 lg:col-span-5">
          <h2 className="mb-4 font-display text-base font-semibold text-[#F3F4F6]">
            Expert Test-Set Benchmarks
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#29313D] text-[#9CA3AF]">
                  <th className="py-2.5 pr-4 font-medium">Metric</th>
                  <th className="py-2.5 pr-4 font-medium text-[#F3F4F6]">test_min3</th>
                  <th className="py-2.5 font-medium text-[#F3F4F6]">test_min1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29313D]/60">
                <tr>
                  <td className="py-2.5 pr-4 text-[#9CA3AF]">Mean IoU</td>
                  <td className="py-2.5 pr-4 font-semibold text-[#E87542]">78.51%</td>
                  <td className="py-2.5 text-[#F3F4F6]">64.50%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#9CA3AF]">Pixel Accuracy</td>
                  <td className="py-2.5 pr-4 font-semibold text-[#F3F4F6]">95.95%</td>
                  <td className="py-2.5 text-[#F3F4F6]">90.67%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#A87952]">Soil IoU</td>
                  <td className="py-2.5 pr-4 text-[#F3F4F6]">93.50%</td>
                  <td className="py-2.5 text-[#F3F4F6]">87.86%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#89939D]">Bedrock IoU</td>
                  <td className="py-2.5 pr-4 text-[#F3F4F6]">93.62%</td>
                  <td className="py-2.5 text-[#F3F4F6]">79.73%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#E6BD62]">Sand IoU</td>
                  <td className="py-2.5 pr-4 text-[#F3F4F6]">89.13%</td>
                  <td className="py-2.5 text-[#F3F4F6]">80.65%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#D95A52]">Big Rock IoU</td>
                  <td className="py-2.5 pr-4 text-[#F3F4F6]">37.80%</td>
                  <td className="py-2.5 text-[#F3F4F6]">9.74%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#9CA3AF]">All-Soil Baseline mIoU</td>
                  <td className="py-2.5 pr-4 text-[#9CA3AF]">12.84%</td>
                  <td className="py-2.5 text-[#9CA3AF]">11.47%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Baseline Comparison & Sand Error Analysis */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* DeepLabV3+ vs All-Soil Baseline */}
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5 lg:col-span-6">
          <h2 className="mb-4 font-display text-base font-semibold text-[#F3F4F6]">
            DeepLabV3+ vs All-Soil Baseline (mIoU)
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={BASELINE_COMPARISON_DATA}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#29313D" vertical={false} />
                <XAxis dataKey="split" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10141B',
                    borderColor: '#29313D',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="deeplabv3plus" name="DeepLabV3+ (%)" fill="#E87542" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baseline" name="All-Soil Baseline (%)" fill="#4B5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sand Error Analysis */}
        <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#F3F4F6]">
              Sand Segmentation Error Analysis (test_min3)
            </h2>
            <span className="rounded bg-[#E6BD62]/15 px-2 py-0.5 font-mono text-xs text-[#E6BD62]">
              110 sand images
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <div className="text-[11px] text-[#9CA3AF]">Precision</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#F3F4F6]">90.46%</div>
            </div>
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <div className="text-[11px] text-[#9CA3AF]">Recall</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#E6BD62]">98.38%</div>
            </div>
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <div className="text-[11px] text-[#9CA3AF]">Sand IoU</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#F3F4F6]">89.13%</div>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <dt className="text-[#9CA3AF]">True Positives</dt>
              <dd className="mt-1 font-semibold text-emerald-400">7,534,904 px</dd>
            </div>
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <dt className="text-[#9CA3AF]">False Positives</dt>
              <dd className="mt-1 font-semibold text-[#E6BD62]">794,796 px</dd>
            </div>
            <div className="rounded-lg border border-[#29313D] bg-[#10141B] p-3">
              <dt className="text-[#9CA3AF]">False Negatives</dt>
              <dd className="mt-1 font-semibold text-[#D95A52]">124,416 px</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Training History Section */}
      <div className="rounded-xl border border-[#29313D] bg-[#151B24] p-5">
        <h2 className="font-display text-base font-semibold text-[#F3F4F6]">
          Recorded Training History
        </h2>

        {hasEpochs && trainingHistory ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#29313D] text-[#9CA3AF]">
                  <th className="py-2 pr-4">Epoch</th>
                  <th className="py-2 pr-4">Train Loss</th>
                  <th className="py-2 pr-4">Val Loss</th>
                  <th className="py-2 pr-4">Val mIoU</th>
                  <th className="py-2">Val Pixel Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29313D]/60">
                {trainingHistory.epochs.map((ep) => (
                  <tr key={ep.epoch}>
                    <td className="py-2 pr-4">{ep.epoch}</td>
                    <td className="py-2 pr-4">
                      {ep.train_loss != null ? ep.train_loss.toFixed(4) : 'N/A'}
                    </td>
                    <td className="py-2 pr-4">
                      {ep.val_loss != null ? ep.val_loss.toFixed(4) : 'N/A'}
                    </td>
                    <td className="py-2 pr-4">
                      {ep.val_miou != null ? `${ep.val_miou.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="py-2">
                      {ep.val_accuracy != null ? `${ep.val_accuracy.toFixed(2)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-[#29313D] bg-[#10141B] p-4 text-xs leading-relaxed text-[#9CA3AF]">
            {trainingHistory?.note ||
              'Per-epoch training logs were not exported into training_history.json. Only verified validation results (Mean IoU: 79.75%, Pixel Accuracy: 95.32%) and expert test-set benchmarks are displayed; no unrecorded epoch losses are fabricated.'}
          </div>
        )}
      </div>
    </div>
  );
};

