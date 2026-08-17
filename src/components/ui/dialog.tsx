import { useRef, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ComponentChildren;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      class="rounded-lg border bg-card p-0 shadow-lg backdrop:bg-black/50 max-w-md w-full"
    >
      <div class="p-6">{children}</div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <h2 class="text-lg font-semibold">{title}</h2>
      <p class="text-sm text-muted-foreground mt-2">{description}</p>
      <div class="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}
