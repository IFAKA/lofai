'use client';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
}

export function BarChart({ data, height = 120, barColor = 'rgba(168, 85, 247, 0.6)' }: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(8, Math.min(32, (280 / data.length) - 4));
  const svgWidth = data.length * (barWidth + 4) + 20;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * (height - 24);
        const x = 10 + i * (barWidth + 4);
        const y = height - 18 - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              rx={3}
              fill={barColor}
            />
            <text
              x={x + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="8"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
