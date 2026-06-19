"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

type ActionResultDialogProps = {
  open: boolean;
  type: "success" | "error";
  message: string;
  onClose: () => void;
};

const AUTO_DISMISS_MS = 2500;

export function ActionResultDialog({ open, type, message, onClose }: ActionResultDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || type === "error") return;
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [open, type, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] backdrop:bg-overlay/50"
    >
      <div className="flex w-72 flex-col items-center gap-3 text-center">
        {type === "success" ? (
          <CheckCircle className="h-8 w-8 text-success" />
        ) : (
          <AlertCircle className="h-8 w-8 text-error" />
        )}
        <p className="text-sm font-medium text-text-primary">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
