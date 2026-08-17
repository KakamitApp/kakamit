import { useRef, useState, useMemo, useEffect, useLayoutEffect } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { subDays, startOfDay, addDays, formatShortDate, formatDate, formatDayKey } from '@/lib/dates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const HEIGHT = 300;
const PAD_LEFT = 35;
const PAD_RIGHT = 35;
const PAD_TOP = 20;
const PAD_BOTTOM = 40;

const COLOR_STOOL = 'hsl(var(--chart-primary))';
const COLOR_EVAL = 'hsl(var(--chart-blue))';
const COLOR_GRID = 'hsl(var(--border))';
const COLOR_LABEL = 'hsl(var(--muted-foreground))';

interface DayDatum {
  date: Date;
  label: string;
  stool: number | null;
  evaluation: number | null;
}

export function ValueChart() {
  const { entries, loading } = useEntries();
  const { t, dateLocale } = useI18n();
  const [period, setPeriod] = useState('7');
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo<DayDatum[]>(() => {
    if (loading) return [];
    const days = parseInt(period);
    const start = startOfDay(subDays(new Date(), days - 1));

    // Pre-index entries by day key in a single pass
    const stoolByDay = new Map<string, number[]>();
    const evalByDay = new Map<string, number>();

    for (const entry of entries) {
      const key = formatDayKey(startOfDay(new Date(entry.timestamp)));
      if (entry.type === 'stool') {
        const arr = stoolByDay.get(key);
        if (arr) arr.push(entry.value);
        else stoolByDay.set(key, [entry.value]);
      } else if (entry.type === 'DGBS') {
        evalByDay.set(key, entry.value);
      }
    }

    const data: DayDatum[] = [];
    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const key = formatDayKey(day);
      const stools = stoolByDay.get(key);
      const stoolAvg = stools ? stools.reduce((a, b) => a + b, 0) / stools.length : null;

      data.push({
        date: day,
        label: formatShortDate(day, dateLocale),
        stool: stoolAvg,
        evaluation: evalByDay.get(key) ?? null,
      });
    }
    return data;
  }, [entries, period, loading, dateLocale]);

  // Measure width synchronously before paint, then keep it in sync.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((obs) => {
      for (const e of obs) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drop any active tooltip when the dataset changes.
  useEffect(() => {
    setActiveIndex(null);
  }, [period, chartData]);

  const hasData = chartData.some((d) => d.stool !== null || d.evaluation !== null);

  const n = chartData.length;
  const chartW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const chartH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const gap = n > 0 ? chartW / n : 0;
  const barWidth = Math.max(2, gap * 0.6);

  const xCenter = (i: number) => PAD_LEFT + i * gap + gap / 2;
  const stoolY = (v: number) => PAD_TOP + chartH - (v / 7) * chartH;
  const evalY = (v: number) => PAD_TOP + chartH - (v / 5) * chartH;

  // Connect the defined evaluation points into a single polyline.
  const evalPoints = chartData
    .map((d, i) => (d.evaluation !== null ? `${xCenter(i)},${evalY(d.evaluation)}` : null))
    .filter((p): p is string => p !== null)
    .join(' ');

  // Thin x-axis labels so they never overlap on narrow screens.
  const labelStep = gap > 0 ? Math.max(1, Math.ceil(45 / gap)) : 1;

  function pointerToIndex(e: PointerEvent): number | null {
    const svg = svgRef.current;
    if (!svg || gap <= 0 || n === 0) return null;
    const rect = svg.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    let idx = Math.floor((localX - PAD_LEFT) / gap);
    if (idx < 0) idx = 0;
    if (idx > n - 1) idx = n - 1;
    return idx;
  }

  function handleMove(e: PointerEvent) {
    setActiveIndex(pointerToIndex(e));
  }

  function handleDown(e: PointerEvent) {
    const target = e.currentTarget as Element | null;
    target?.setPointerCapture?.(e.pointerId);
    setActiveIndex(pointerToIndex(e));
  }

  function handleEnd(e: PointerEvent) {
    const target = e.currentTarget as Element | null;
    try {
      target?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* capture may already be released */
    }
    setActiveIndex(null);
  }

  const active = activeIndex !== null ? chartData[activeIndex] : null;
  const activeX = activeIndex !== null ? xCenter(activeIndex) : 0;
  const tipLeft = width > 0 ? Math.min(Math.max(activeX, 72), width - 72) : 0;

  const showChart = !loading && hasData && width > 0 && n > 0;

  return (
    <Card>
      <CardHeader>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="mb-4 sm:mb-0">
            <CardTitle>{t('chart.title')}</CardTitle>
            <CardDescription>{t('chart.description')}</CardDescription>
          </div>
          <select
            class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-[180px]"
            value={period}
            aria-label={t('chart.timePeriodPlaceholder')}
            onChange={(e) => setPeriod((e.target as HTMLSelectElement).value)}
          >
            <option value="7">{t('chart.last7Days')}</option>
            <option value="30">{t('chart.last30Days')}</option>
            <option value="90">{t('chart.last90Days')}</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_STOOL }} />
            {t('chart.stoolType')}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_EVAL }} />
            {t('chart.dailyEvaluation')}
          </span>
        </div>

        <div ref={containerRef} class="relative h-[300px]">
          {loading && (
            <div class="h-[300px] animate-pulse rounded-md bg-muted" />
          )}

          {!loading && !hasData && (
            <div class="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground">
              {t('chart.noData')}
            </div>
          )}

          {showChart && (
            <svg
              ref={svgRef}
              width={width}
              height={HEIGHT}
              class="block select-none"
              role="img"
              aria-label={t('chart.title')}
            >
              <title>{t('chart.title')}</title>
              <desc>{t('chart.description')}</desc>

              {/* Grid + left axis (stool 1-7) */}
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <g key={`l${i}`}>
                  <line
                    x1={PAD_LEFT}
                    y1={stoolY(i)}
                    x2={PAD_LEFT + chartW}
                    y2={stoolY(i)}
                    style={{ stroke: COLOR_GRID }}
                    stroke-width={0.5}
                  />
                  <text
                    x={PAD_LEFT - 6}
                    y={stoolY(i) + 4}
                    text-anchor="end"
                    font-size={11}
                    style={{ fill: COLOR_LABEL }}
                  >
                    {i}
                  </text>
                </g>
              ))}

              {/* Right axis (evaluation 1-5) */}
              {[1, 2, 3, 4, 5].map((i) => (
                <text
                  key={`r${i}`}
                  x={PAD_LEFT + chartW + 6}
                  y={evalY(i) + 4}
                  text-anchor="start"
                  font-size={11}
                  style={{ fill: COLOR_LABEL }}
                >
                  {i}
                </text>
              ))}

              {/* Bars (stool) */}
              {chartData.map((d, i) =>
                d.stool === null ? null : (
                  <rect
                    key={`b${i}`}
                    x={PAD_LEFT + i * gap + (gap - barWidth) / 2}
                    y={stoolY(d.stool)}
                    width={barWidth}
                    height={(d.stool / 7) * chartH}
                    rx={2}
                    style={{ fill: COLOR_STOOL }}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.55}
                  />
                )
              )}

              {/* Line (evaluation) */}
              {evalPoints && (
                <polyline
                  points={evalPoints}
                  fill="none"
                  style={{ stroke: COLOR_EVAL }}
                  stroke-width={2}
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
              )}

              {/* Dots (evaluation) */}
              {chartData.map((d, i) =>
                d.evaluation === null ? null : (
                  <circle
                    key={`d${i}`}
                    cx={xCenter(i)}
                    cy={evalY(d.evaluation)}
                    r={activeIndex === i ? 5 : 3}
                    style={{ fill: COLOR_EVAL }}
                  />
                )
              )}

              {/* X-axis labels */}
              {chartData.map((d, i) =>
                i % labelStep === 0 ? (
                  <text
                    key={`x${i}`}
                    x={xCenter(i)}
                    y={HEIGHT - 12}
                    text-anchor="middle"
                    font-size={10}
                    style={{ fill: COLOR_LABEL }}
                  >
                    {d.label}
                  </text>
                ) : null
              )}

              {/* Active indicator */}
              {active && (
                <line
                  x1={activeX}
                  y1={PAD_TOP}
                  x2={activeX}
                  y2={PAD_TOP + chartH}
                  style={{ stroke: COLOR_LABEL }}
                  stroke-width={1}
                  stroke-dasharray="3 3"
                />
              )}

              {/* Pointer/scrub overlay (kept last so it captures events) */}
              <rect
                x={PAD_LEFT}
                y={PAD_TOP}
                width={chartW}
                height={chartH}
                fill="transparent"
                style={{ touchAction: 'pan-y', cursor: 'crosshair', pointerEvents: 'all' }}
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={handleEnd}
                onPointerLeave={handleEnd}
                onPointerCancel={handleEnd}
              />
            </svg>
          )}

          {/* Tooltip */}
          {showChart && active && (
            <div
              class="pointer-events-none absolute top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-card px-3 py-2 text-xs text-card-foreground shadow-md"
              style={{ left: `${tipLeft}px` }}
            >
              <div class="mb-1 font-medium">{formatDate(active.date, dateLocale)}</div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COLOR_STOOL }} />
                <span>{t('chart.stoolType')}:</span>
                <span class="font-medium">{active.stool !== null ? active.stool.toFixed(1) : '–'}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COLOR_EVAL }} />
                <span>{t('chart.dailyEvaluation')}:</span>
                <span class="font-medium">{active.evaluation !== null ? active.evaluation : '–'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Screen-reader accessible data table */}
        {hasData && (
          <table class="sr-only">
            <caption>{t('chart.title')}</caption>
            <thead>
              <tr>
                <th>{t('chart.timePeriodPlaceholder')}</th>
                <th>{t('chart.stoolType')}</th>
                <th>{t('chart.dailyEvaluation')}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => (
                <tr key={`sr${i}`}>
                  <td>{formatDate(d.date, dateLocale)}</td>
                  <td>{d.stool !== null ? d.stool.toFixed(1) : '–'}</td>
                  <td>{d.evaluation !== null ? d.evaluation : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
