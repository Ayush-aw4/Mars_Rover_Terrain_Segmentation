import React from 'react';

export const TERRAIN_CLASSES = [
  {
    id: 0,
    name: 'Soil',
    hex: '#A87952',
    description: 'Martian regolith and fine dusty surface material',
  },
  {
    id: 1,
    name: 'Bedrock',
    hex: '#89939D',
    description: 'Consolidated planetary rock outcrops',
  },
  {
    id: 2,
    name: 'Sand',
    hex: '#E6BD62',
    description: 'Loose aeolian sand deposits & slip hazards',
  },
  {
    id: 3,
    name: 'Big Rock',
    hex: '#D95A52',
    description: 'Rocks > 30 cm tall and >= 50 cm wide',
  },
] as const;

interface TerrainLegendProps {
  compact?: boolean;
}

export const TerrainLegend: React.FC<TerrainLegendProps> = ({ compact = false }) => {
  return (
    <div className={`flex flex-wrap items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      {TERRAIN_CLASSES.map((cls) => (
        <div
          key={cls.id}
          title={cls.description}
          className="flex items-center gap-2 rounded-md border border-[#29313D] bg-[#10141B] px-2.5 py-1.5"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-sm border border-white/10"
            style={{ backgroundColor: cls.hex }}
          />
          <span className="text-xs font-medium text-[#F3F4F6]">{cls.name}</span>
          {!compact && (
            <span className="font-mono text-[11px] text-[#9CA3AF]">{cls.hex}</span>
          )}
        </div>
      ))}
    </div>
  );
};

