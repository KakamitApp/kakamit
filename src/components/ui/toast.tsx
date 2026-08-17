import { createContext } from 'preact';
import { useState, useCallback, useContext } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: ComponentChildren }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            class={`rounded-lg border p-4 shadow-lg bg-card text-card-foreground animate-in slide-in-from-bottom-2 ${
              t.variant === 'destructive' ? 'border-destructive' : ''
            }`}
            onClick={() => dismiss(t.id)}
          >
            <p class="text-sm font-semibold">{t.title}</p>
            {t.description && <p class="text-sm text-muted-foreground mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
