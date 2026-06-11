import { PerformanceData } from '../api/analytics-endpoints';
import { Card } from './ui';

interface Props {
  data: PerformanceData | null;
  isLoading?: boolean;
}

export default function PerformanceCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-20 animate-pulse bg-paper/50 rounded"></div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-xs text-ink/40">No performance data yet</p>
      </Card>
    );
  }

  return (
    <Card className={`p-3 ${data.score >= 85 ? 'border-pine/30 bg-pine/5' : data.score >= 70 ? 'border-marigold/30 bg-marigold/5' : 'border-terra/30 bg-terra/5'}`}>
      {/* Score */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase font-bold text-ink/40">Performance</p>
          <div className="flex items-baseline gap-1">
            <p className="font-display text-3xl font-black">{data.score}</p>
            <p className="text-xs font-bold text-ink/50">/100</p>
          </div>
        </div>
        <div className="text-right">
          {data.breakdown.bonus > 0 && <p className="text-xs font-bold text-pine">↑ +{data.breakdown.bonus}</p>}
          {data.breakdown.bonus < 0 && <p className="text-xs font-bold text-terra">↓ {data.breakdown.bonus}</p>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <p className="mb-2 text-xs leading-tight text-ink/70">
          {data.summary}
        </p>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded bg-paper px-1.5 py-1">
          <p className="font-bold text-ink">{data.metrics.tasksCompleted}</p>
          <p className="text-ink/50">Tasks ✓</p>
        </div>
        <div className="rounded bg-paper px-1.5 py-1">
          <p className="font-bold text-ink">{data.metrics.hoursLogged.toFixed(1)}h</p>
          <p className="text-ink/50">Hours</p>
        </div>
        <div className="rounded bg-paper px-1.5 py-1">
          <p className="font-bold text-ink">{data.breakdown.efficiency}%</p>
          <p className="text-ink/50">Eff.</p>
        </div>
      </div>
    </Card>
  );
}
