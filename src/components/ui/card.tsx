import { cn } from '@/lib/utils';
import type { ComponentChildren } from 'preact';

export function Card({ class: cls, children }: { class?: string; children: ComponentChildren }) {
  return (
    <div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', cls)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, class: cls }: { children: ComponentChildren; class?: string }) {
  return <div class={cn('flex flex-col space-y-1.5 p-6', cls)}>{children}</div>;
}

export function CardTitle({ children, class: cls }: { children: ComponentChildren; class?: string }) {
  return <h3 class={cn('font-semibold tracking-tight font-headline text-2xl', cls)}>{children}</h3>;
}

export function CardDescription({ children }: { children: ComponentChildren }) {
  return <div class="text-sm text-muted-foreground">{children}</div>;
}

export function CardContent({ children, class: cls }: { children: ComponentChildren; class?: string }) {
  return <div class={cn('p-6 pt-0', cls)}>{children}</div>;
}

export function CardFooter({ children }: { children: ComponentChildren }) {
  return <div class="flex items-center p-6 pt-0">{children}</div>;
}
