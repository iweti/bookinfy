"use client";

import Link from "next/link";
import { ArrowRight, Check, Inbox, LoaderCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Button({
  className = "",
  variant = "primary",
  busy,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      {...props}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  arrow = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={`button button-${variant} ${className}`}>
      {children}
      {arrow ? <ArrowRight size={17} /> : null}
    </Link>
  );
}

export function Field({
  label,
  hint,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
      />
      {hint || error ? (
        <small
          id={`${id}-hint`}
          className={error ? "text-danger" : "text-muted"}
        >
          {error ?? hint}
        </small>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Avatar({
  initials,
  color = "purple",
  small = false,
}: {
  initials: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`avatar avatar-${color} ${small ? "avatar-small" : ""}`}
    >
      {initials}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Carregando">
      <div className="skeleton skeleton-title" />
      <div className="grid-three">
        {[1, 2, 3].map((id) => (
          <div key={id} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-large" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
export function InlineError({ children }: { children: ReactNode }) {
  return children ? (
    <p className="inline-error" role="alert">
      {children}
    </p>
  ) : null;
}

export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const active = document.activeElement as HTMLElement | null;
    element?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = oldOverflow;
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

const ToastContext = createContext<(message: string) => void>(() => {});
export function useToast() {
  return useContext(ToastContext);
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 5000);
  }, []);
  useEffect(() => {
    const handler = () =>
      toast(
        "O navegador bloqueou o armazenamento. As alterações durarão até recarregar esta página.",
      );
    window.addEventListener("bookinfy:storage-unavailable", handler);
    return () => {
      window.removeEventListener("bookinfy:storage-unavailable", handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {message ? (
          <div className="toast">
            <Check size={19} />
            <span>{message}</span>
            <button
              className="icon-button"
              onClick={() => setMessage("")}
              aria-label="Dispensar mensagem"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
