import React from 'react';
import { Activity, Cpu, RefreshCw } from 'lucide-react';
import type { HealthResponse, PageTab } from '../types/api';

interface NavbarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

const NAV_ITEMS: { id: PageTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'analysis', label: 'Terrain Analysis' },
  { id: 'performance', label: 'Model Performance' },
  { id: 'methodology', label: 'Methodology' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const isBackendOnline = health !== null;
  const isModelReady = Boolean(health?.model_loaded);

  let statusDotColor = 'bg-[#D95A52]';
  let statusText = 'Backend Offline';
  let statusBorder = 'border-[#D95A52]/30 bg-[#D95A52]/10 text-[#F3F4F6]';

  if (isBackendOnline && isModelReady) {
    statusDotColor = 'bg-emerald-400';
    statusText = 'Model Online';
    statusBorder = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  } else if (isBackendOnline && !isModelReady) {
    statusDotColor = 'bg-[#E6BD62]';
    statusText = 'Checkpoint Missing';
    statusBorder = 'border-[#E6BD62]/30 bg-[#E6BD62]/10 text-[#E6BD62]';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#29313D] bg-[#090B0F]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="group flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E87542]/40 bg-[#E87542]/10 text-[#E87542] transition-colors group-hover:bg-[#E87542]/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-[0.08em] text-[#F3F4F6] sm:text-base">
              MARS TERRAIN INTELLIGENCE
            </div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#9CA3AF]">
              PLANETARY SURFACE ANALYSIS
            </div>
          </div>
        </button>

        {/* Navigation */}
        <nav aria-label="Primary Navigation" className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  isActive
                    ? 'text-[#F3F4F6]'
                    : 'text-[#9CA3AF] hover:bg-[#151B24] hover:text-[#F3F4F6]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#E87542]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center gap-2.5">
          {health?.device && (
            <div className="hidden items-center gap-1.5 rounded-md border border-[#29313D] bg-[#151B24] px-2.5 py-1 font-mono text-xs text-[#9CA3AF] md:flex">
              <Cpu className="h-3.5 w-3.5 text-[#E87542]" />
              <span className="uppercase">{health.device}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onRefreshHealth}
            title={health?.message || 'Click to refresh backend connection'}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-opacity hover:opacity-90 ${statusBorder}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusDotColor} ${isModelReady ? 'animate-pulse' : ''}`} />
            <span>{statusText}</span>
            <RefreshCw className={`h-3 w-3 opacity-70 ${healthLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

