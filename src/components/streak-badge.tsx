import { useEffect, useRef } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { computeLoggingStreak, getStreakMilestone } from '@/lib/streaks';

export function StreakBadge() {
  const { entries, loading } = useEntries();
  const { t } = useI18n();
  const { toast } = useToast();
  const prevStreakRef = useRef<number>(-1);
  const prevTotalRef = useRef<number>(-1);

  const streak = computeLoggingStreak(entries);

  useEffect(() => {
    if (loading) return;

    // Skip first render (initial load from DB)
    if (prevStreakRef.current === -1) {
      prevStreakRef.current = streak.current;
      prevTotalRef.current = streak.totalEntries;
      return;
    }

    // Only fire toast if entries count actually increased (new entry added)
    if (streak.totalEntries <= prevTotalRef.current) {
      prevStreakRef.current = streak.current;
      prevTotalRef.current = streak.totalEntries;
      return;
    }

    const milestone = getStreakMilestone(
      streak.current,
      prevStreakRef.current,
      streak.longest,
      streak.totalEntries
    );

    if (milestone) {
      let title: string;
      if (milestone === 'firstEntry') {
        title = t('streak.firstEntry');
      } else if (milestone === 'newRecord') {
        title = t('streak.newRecord', { days: String(streak.current) });
      } else if (milestone === 'days') {
        title = streak.current === 1
          ? t('streak.day1')
          : t('streak.days', { days: String(streak.current) });
      } else {
        // milestone7, milestone14, etc.
        title = t(`streak.${milestone}`);
      }
      toast({ title });
    }

    prevStreakRef.current = streak.current;
    prevTotalRef.current = streak.totalEntries;
  }, [entries, loading]);

  // Don't show anything while loading or for brand new users with no entries
  if (loading || streak.totalEntries === 0) return null;

  // Streak is broken — encourage to restart
  if (streak.current === 0) {
    return (
      <div class="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground">
        <span class="text-lg flex-shrink-0">💤</span>
        <span>{t('streak.startNew')}</span>
      </div>
    );
  }

  return (
    <div class="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-medium text-primary">
      <span class="text-lg flex-shrink-0">🔥</span>
      <span>
        {streak.current === 1
          ? t('streak.day1')
          : t('streak.days', { days: String(streak.current) })}
      </span>
      {streak.current >= streak.longest && streak.current >= 3 && (
        <span class="ml-auto text-xs text-muted-foreground">
          ⭐ {t('streak.record')}
        </span>
      )}
    </div>
  );
}
