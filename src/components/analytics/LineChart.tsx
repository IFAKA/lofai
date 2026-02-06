'use client';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  lineColor?: string;
}

export function LineChart({ data, height = 100, lineColor = 'rgba(168, 85, 247, 0.8)' }: LineChartProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 8, bottom: 20, left: 10, right: 10 };
  const svgWidth = Math.max(200, data.length * 24);
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Line chart"
    >
      <defs>
        <linearGradient id="lineChartGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaD} fill="url(#lineChartGradient)" />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={lineColor} />
      ))}

      {/* X-axis labels - show every Nth label to avoid crowding */}
      {data.map((d, i) => {
        const skip = Math.max(1, Math.floor(data.length / 7));
        if (i % skip !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={i}
            x={points[i].x}
            y={height - 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="8"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
