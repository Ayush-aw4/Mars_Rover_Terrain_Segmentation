import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { MethodologyPage } from './pages/MethodologyPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { OverviewPage } from './pages/OverviewPage';
import { TerrainAnalysisPage } from './pages/TerrainAnalysisPage';
import { fetchHealth, fetchModelInfo } from './services/api';
import type { HealthResponse, ModelInfoResponse, PageTab } from './types/api';

export function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  const loadStatus = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [h, info] = await Promise.all([
        fetchHealth(),
        fetchModelInfo().catch(() => null),
      ]);
      setHealth(h);
      if (info) {
        setModelInfo(info);
      }
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return (
    <div className="topo-bg flex min-h-screen flex-col text-[#F3F4F6]">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={loadStatus}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <OverviewPage onNavigate={setActiveTab} health={health} />
        )}
        {activeTab === 'analysis' && <TerrainAnalysisPage health={health} />}
        {activeTab === 'performance' && <ModelPerformancePage modelInfo={modelInfo} />}
        {activeTab === 'methodology' && <MethodologyPage />}
      </main>

      <footer className="border-t border-[#29313D] bg-[#090B0F]/80 py-4 text-center font-mono text-xs text-[#9CA3AF]">
        MARS TERRAIN INTELLIGENCE · DeepLabV3+ (ResNet-50) · NASA JPL AI4Mars Research Prototype
      </footer>
    </div>
  );
}

export default App;
