import { useEffect, useState, useRef } from 'preact/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { computeInsights } from '@/lib/insights';
import type { Insight } from '@/lib/insights';

function getWeekdayName(dayIndex: number, locale: string): string {
  // dayIndex: 0=Sunday ... 6=Saturday
  // Use a known Sunday (Jan 7, 2024) as reference
  const refDate = new Date(2024, 0, 7 + dayIndex);
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(refDate);
}

const ICONS: Record<string, string> = {
  trend: '📈',
  correlation: '🔗',
  weekday: '📅',
};

export function InsightsCard() {
  const { entries } = useEntries();
  const { t, dateLocale } = useI18n();
  const [insights, setInsights] = useState<Insight[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/insights-worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current.onmessage = (e: MessageEvent) => {
        setInsights(e.data);
      };
    } catch {
      // Fallback: run on main thread if module workers are unsupported
      workerRef.current = null;
    }
    return () => { workerRef.current?.terminate(); };
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      if (workerRef.current) {
        workerRef.current.postMessage(entries);
      } else {
        // Main-thread fallback
        setInsights(computeInsights(entries));
      }
    } else {
      setInsights([]);
    }
  }, [entries]);

  if (insights.length === 0) return null;

  function formatInsight(insight: Insight): string {
    switch (insight.type) {
      case 'trend':
        return insight.direction === 'down'
          ? t('insights.trendDown', { percent: String(insight.params.percent) })
          : t('insights.trendUp', { percent: String(insight.params.percent) });

      case 'correlation': {
        const group = insight.params.group === 'hard'
          ? t('insights.stoolHard')
          : t('insights.stoolLoose');
        return t('insights.correlation', { group, diff: String(insight.params.diff) });
      }

      case 'weekday': {
        const worst = getWeekdayName(insight.params.worstDay as number, dateLocale);
        const worstAvg = insight.params.worstAvg;
        return t('insights.weekday', { day: worst, avg: String(worstAvg) });
      }

      default:
        return '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">{t('insights.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} class="flex items-start gap-3 text-sm">
              <span class="text-lg flex-shrink-0">{ICONS[insight.type]}</span>
              <span class="text-muted-foreground">{formatInsight(insight)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
