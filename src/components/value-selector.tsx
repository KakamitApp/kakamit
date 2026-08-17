import { useRef, useEffect } from 'preact/hooks';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ValueSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const ITEMS = [
  { value: 1, image: '/200_kaka_1.png' },
  { value: 2, image: '/200_kaka_2.png' },
  { value: 3, image: '/200_kaka_3.png' },
  { value: 4, image: '/200_kaka_4.png' },
  { value: 5, image: '/200_kaka_5.png' },
  { value: 6, image: '/200_kaka_6.png' },
  { value: 7, image: '/200_kaka_7.png' },
];

export function ValueSelector({ value, onChange }: ValueSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useI18n();

  const scrollToValue = (val: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;
    const element = container.children[val] as HTMLElement; // +1 for top spacer
    if (!element) return;
    // Scroll only the wheel's own container, never the page, so the host page
    // keeps control of its scroll position.
    const top = element.offsetTop + element.offsetHeight / 2 - container.offsetHeight / 2;
    container.scrollTo({ top, behavior });
  };

  useEffect(() => {
    scrollToValue(value, 'instant');
    return () => { if (scrollTimeout.current) clearTimeout(scrollTimeout.current); };
  }, []);

  const onScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, offsetHeight, children } = container;
      const center = scrollTop + offsetHeight / 2;
      let closest = 0;
      let minDist = Infinity;

      for (let i = 1; i < children.length - 1; i++) {
        const child = children[i] as HTMLElement;
        const childCenter = child.offsetTop + child.offsetHeight / 2;
        const dist = Math.abs(center - childCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = i - 1;
        }
      }

      const newValue = closest + 1;
      if (newValue !== value) {
        onChange(newValue);
      }
      scrollToValue(newValue, 'smooth');
    }, 150);
  };

  return (
    <div class="relative h-64 w-full max-w-sm mx-auto">
      <div
        ref={containerRef}
        onScroll={onScroll}
        class="h-full w-full overflow-y-scroll no-scrollbar"
        style="scroll-snap-type: y mandatory"
      >
        <div class="h-[calc(50%-4rem)]" />
        {ITEMS.map(({ value: val, image }) => (
          <div
            key={val}
            onClick={() => { onChange(val); scrollToValue(val); }}
            class={cn(
              'flex h-32 cursor-pointer items-center justify-center p-4 transition-all duration-300',
              value === val ? 'scale-100 opacity-100' : 'scale-90 opacity-40'
            )}
            style="scroll-snap-align: center"
          >
            <div class="flex items-center gap-4 w-full">
              <img
                src={image}
                alt={t(`selection.type${val}`)}
                width={80}
                height={80}
                class="rounded-lg object-cover"
                loading="lazy"
              />
              <div class="flex flex-col text-left">
                <p class="font-semibold">{t('selection.typeLabel')} {val}</p>
                <p class="text-sm text-muted-foreground">{t(`selection.type${val}`)}</p>
              </div>
            </div>
          </div>
        ))}
        <div class="h-[calc(50%-4rem)]" />
      </div>
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="h-40 w-full rounded-lg border-2 border-accent" />
      </div>
    </div>
  );
}
