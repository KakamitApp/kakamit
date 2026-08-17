import { useMemo, useState } from 'preact/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntries } from '@/lib/entries';
import { formatDate } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { createReportSummary, type ReportPeriod } from '@/lib/report';
import { Link } from '@/lib/router';

const PERIODS: ReportPeriod[] = [7, 30, 90];

function formatAverage(value: number | null): string {
  return value === null ? '-' : (Math.round(value * 10) / 10).toFixed(1);
}

function joinValues(values: number[]): string {
  return values.length ? values.join(', ') : '-';
}

function countLabel(count: number, total: number): string {
  return `${count} / ${total}`;
}

export default function Report() {
  const { entries, loading } = useEntries();
  const { t, dateLocale } = useI18n();
  const [period, setPeriod] = useState<ReportPeriod>(30);

  const report = useMemo(() => createReportSummary(entries, period), [entries, period]);
  const generatedAt = useMemo(() => new Date(), []);

  const range = `${formatDate(report.startDate, dateLocale)} - ${formatDate(report.endDate, dateLocale)}`;
  const visibleDays = report.days.filter((day) => day.stoolValues.length || day.dgbsValues.length || day.comments.length);
  const dailyRows = visibleDays.slice(-30);
  const dominantStool = report.dominantStoolCategory ? t(`report.stoolCategory.${report.dominantStoolCategory}`) : '-';
  const findings = [
    report.missingDays > Math.floor(report.period * 0.25)
      ? t('report.findings.missingDays', { days: String(report.missingDays) })
      : null,
    report.highDgbsDays > 0
      ? t('report.findings.highDgbsDays', { days: String(report.highDgbsDays) })
      : null,
    report.looseStoolDays > 0
      ? t('report.findings.looseStoolDays', { days: String(report.looseStoolDays) })
      : null,
    report.maxType7Streak >= 2
      ? t('report.findings.type7Streak', { days: String(report.maxType7Streak) })
      : null,
    report.maxHighDgbsStreak >= 2
      ? t('report.findings.highDgbsStreak', { days: String(report.maxHighDgbsStreak) })
      : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <main class="report-page max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div class="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" class="text-sm underline text-muted-foreground hover:text-primary">
          {t('report.back')}
        </Link>
        <div class="flex flex-col sm:flex-row gap-3">
          <select
            class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={period}
            aria-label={t('report.periodLabel')}
            onChange={(event) => setPeriod(Number((event.target as HTMLSelectElement).value) as ReportPeriod)}
          >
            {PERIODS.map((value) => (
              <option key={value} value={value}>{t(`report.period${value}`)}</option>
            ))}
          </select>
          <Button onClick={() => window.print()} disabled={loading || !report.entries.length}>
            {t('report.printButton')}
          </Button>
        </div>
      </div>

      <section class="report-sheet space-y-6 rounded-xl border bg-card p-5 shadow-sm print:border-0 print:shadow-none print:p-0">
        <header class="space-y-2 border-b pb-4">
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">Kakamit</p>
          <h1 class="text-3xl font-bold tracking-tight">{t('report.title')}</h1>
          <div class="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 print:grid-cols-2">
            <p>{t('report.periodLabel')}: {range}</p>
            <p>{t('report.generatedAt')}: {formatDate(generatedAt, dateLocale)}</p>
          </div>
        </header>

        {loading ? (
          <Card>
            <CardContent class="py-8 text-center text-muted-foreground">{t('report.loading')}</CardContent>
          </Card>
        ) : !report.entries.length ? (
          <Card>
            <CardContent class="py-8 text-center text-muted-foreground">{t('report.noData')}</CardContent>
          </Card>
        ) : (
          <>
            <section class="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
              <Card>
                <CardHeader class="pb-2"><CardTitle class="text-sm">{t('report.dgbsEntries')}</CardTitle></CardHeader>
                <CardContent class="text-2xl font-bold">{report.dgbsEntries.length}</CardContent>
              </Card>
              <Card>
                <CardHeader class="pb-2"><CardTitle class="text-sm">{t('report.stoolEntries')}</CardTitle></CardHeader>
                <CardContent class="text-2xl font-bold">{report.stoolEntries.length}</CardContent>
              </Card>
              <Card>
                <CardHeader class="pb-2"><CardTitle class="text-sm">{t('report.dgbsAverage')}</CardTitle></CardHeader>
                <CardContent class="text-2xl font-bold">{formatAverage(report.dgbsAverage)}</CardContent>
              </Card>
              <Card>
                <CardHeader class="pb-2"><CardTitle class="text-sm">{t('report.stoolAverage')}</CardTitle></CardHeader>
                <CardContent class="text-2xl font-bold">{formatAverage(report.stoolAverage)}</CardContent>
              </Card>
            </section>

            <section class="grid gap-4 md:grid-cols-2 print:grid-cols-2">
              <Card>
                <CardHeader><CardTitle class="text-lg">{t('report.clinicalSummary')}</CardTitle></CardHeader>
                <CardContent>
                  <dl class="grid grid-cols-1 gap-2 text-sm">
                    <div class="flex justify-between gap-4 border-b pb-2">
                      <dt class="text-muted-foreground">{t('report.dataCoverage')}</dt>
                      <dd class="font-medium">{countLabel(report.daysWithData, report.period)}</dd>
                    </div>
                    <div class="flex justify-between gap-4 border-b pb-2">
                      <dt class="text-muted-foreground">{t('report.missingDays')}</dt>
                      <dd class="font-medium">{report.missingDays}</dd>
                    </div>
                    <div class="flex justify-between gap-4 border-b pb-2">
                      <dt class="text-muted-foreground">{t('report.dominantStool')}</dt>
                      <dd class="font-medium">{dominantStool}</dd>
                    </div>
                    <div class="flex justify-between gap-4 border-b pb-2">
                      <dt class="text-muted-foreground">{t('report.highDgbsDays')}</dt>
                      <dd class="font-medium">{report.highDgbsDays}</dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-muted-foreground">{t('report.looseStoolDays')}</dt>
                      <dd class="font-medium">{report.looseStoolDays}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle class="text-lg">{t('report.notableFindings')}</CardTitle></CardHeader>
                <CardContent>
                  {findings.length ? (
                    <ul class="space-y-2 text-sm">
                      {findings.map((finding) => (
                        <li key={finding} class="flex gap-2">
                          <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p class="text-sm text-muted-foreground">{t('report.noNotableFindings')}</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 class="mb-3 text-xl font-semibold">{t('report.weeklySummary')}</h2>
              <div class="overflow-x-auto rounded-md border">
                <table class="w-full min-w-[560px] text-left text-sm">
                  <thead class="bg-muted/50">
                    <tr>
                      <th class="px-3 py-2 font-medium">{t('report.week')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.dataDays')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.stoolAverage')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.dgbsAverage')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.totalEntries')}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {report.weeks.map((week) => (
                      <tr key={week.label}>
                        <td class="px-3 py-2 whitespace-nowrap">
                          {formatDate(week.startDate, dateLocale)} - {formatDate(week.endDate, dateLocale)}
                        </td>
                        <td class="px-3 py-2">{countLabel(week.daysWithData, week.totalDays)}</td>
                        <td class="px-3 py-2">{formatAverage(week.stoolAverage)}</td>
                        <td class="px-3 py-2">{formatAverage(week.dgbsAverage)}</td>
                        <td class="px-3 py-2">{week.stoolEntries + week.dgbsEntries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section class="grid gap-4 md:grid-cols-2 print:grid-cols-2">
              <Card>
                <CardHeader><CardTitle class="text-lg">{t('report.stoolDistribution')}</CardTitle></CardHeader>
                <CardContent>
                  <table class="w-full text-sm">
                    <tbody>
                      {Object.entries(report.stoolDistribution).map(([value, count]) => (
                        <tr key={value} class="border-b last:border-0">
                          <td class="py-2">{t('selection.typeLabel')} {value}</td>
                          <td class="py-2 text-right font-medium">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle class="text-lg">{t('report.dgbsDistribution')}</CardTitle></CardHeader>
                <CardContent>
                  <table class="w-full text-sm">
                    <tbody>
                      {Object.entries(report.dgbsDistribution).map(([value, count]) => (
                        <tr key={value} class="border-b last:border-0">
                          <td class="py-2">{t('report.level')} {value}</td>
                          <td class="py-2 text-right font-medium">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 class="mb-3 text-xl font-semibold">{t('report.dailySummary')}</h2>
              {visibleDays.length > dailyRows.length && (
                <p class="mb-3 text-sm text-muted-foreground">{t('report.dailyLimitNote')}</p>
              )}
              <div class="overflow-x-auto rounded-md border">
                <table class="w-full min-w-[620px] text-left text-sm">
                  <thead class="bg-muted/50">
                    <tr>
                      <th class="px-3 py-2 font-medium">{t('report.date')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.stoolValues')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.dgbsValues')}</th>
                      <th class="px-3 py-2 font-medium">{t('report.comments')}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {dailyRows.map((day) => (
                      <tr key={day.date.toISOString()}>
                        <td class="px-3 py-2 whitespace-nowrap">{formatDate(day.date, dateLocale)}</td>
                        <td class="px-3 py-2">{joinValues(day.stoolValues)}</td>
                        <td class="px-3 py-2">{joinValues(day.dgbsValues)}</td>
                        <td class="px-3 py-2">{day.comments.length ? day.comments.join('; ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer class="space-y-2 border-t pt-4 text-xs text-muted-foreground">
          <p><strong>{t('report.disclaimerTitle')}</strong> {t('report.disclaimerBody')}</p>
          <p>{t('report.privacyNote')}</p>
        </footer>
      </section>
    </main>
  );
}
