import { cn } from '@/lib/utils';

export interface ScaleItem {
  value: number;
  image: string;
  alt: string;
}

interface ScaleSelectorProps {
  items: ScaleItem[];
  value: number;
  onChange: (v: number) => void;
}

/**
 * Compact, all-visible image selector used inside the edit dialog.
 * Every option is shown at once (no nested scrolling) so a correction
 * is a single tap — works well inside a modal on mobile.
 */
export function ScaleSelector({ items, value, onChange }: ScaleSelectorProps) {
  return (
    <div
      class="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-label={item.alt}
            aria-pressed={selected}
            onClick={() => onChange(item.value)}
            class={cn(
              'flex aspect-square items-center justify-center rounded-md border p-1 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary border-2 bg-primary/10 opacity-100'
                : 'border-input opacity-50 hover:opacity-80'
            )}
          >
            <img
              src={item.image}
              alt={item.alt}
              width={48}
              height={48}
              class="h-full w-full object-contain"
              loading="lazy"
            />
          </button>
        );
      })}
    </div>
  );
}
