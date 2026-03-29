import { useCallback, useEffect, useState } from 'react';
import './dialog.css';

/* ── Hook ─────────────────────────────────────────────────────────── */
export function useDialog() {
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  /** Show a self-dismissing notification. type = 'success' | 'error' | 'info' */
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  /** Show a Yes / No confirmation — returns Promise<boolean> */
  const confirm = useCallback((message, subtext = '') => {
    return new Promise((resolve) => {
      setModal({ type: 'confirm', message, subtext, resolve });
    });
  }, []);

  /** Show a text-input prompt — returns Promise<string | null> */
  const prompt = useCallback((message, defaultValue = '') => {
    return new Promise((resolve) => {
      setModal({ type: 'prompt', message, defaultValue, resolve });
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleModalResult = useCallback(
    (result) => {
      if (modal?.resolve) modal.resolve(result);
      setModal(null);
    },
    [modal]
  );

  return { notify, confirm, prompt, toast, modal, dismissToast, handleModalResult };
}

/* ── Toast notification ───────────────────────────────────────────── */
export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss || (() => {}), 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const handleDismiss = () => onDismiss && onDismiss();

  return (
    <div className={`app-toast app-toast-${toast.type}`} role="alert" aria-live="polite">
      <i className="app-toast-icon">{icons[toast.type] || '•'}</i>
      <span className="app-toast-msg">{toast.message}</span>
      <button className="app-toast-close" onClick={handleDismiss} aria-label="Close">×</button>
    </div>
  );
}

/* ── Confirm / Prompt modal ───────────────────────────────────────── */
export function DialogModal({ modal, onResult }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(modal?.defaultValue || '');
  }, [modal]);

  if (!modal) return null;

  const isPrompt = modal.type === 'prompt';

  return (
    <div
      className="app-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => !isPrompt && onResult(false)}
    >
      <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
        <p className="app-modal-title">{isPrompt ? 'Input Required' : 'Confirm Action'}</p>
        <p className="app-modal-msg">{modal.message}</p>
        {modal.subtext ? <p className="app-modal-sub">{modal.subtext}</p> : null}

        {isPrompt ? (
          <textarea
            className="app-modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={3}
            autoFocus
          />
        ) : null}

        <div className="app-modal-actions">
          <button className="app-modal-btn-no" onClick={() => onResult(isPrompt ? null : false)}>
            {isPrompt ? 'Cancel' : 'No'}
          </button>
          <button
            className="app-modal-btn-yes"
            onClick={() => onResult(isPrompt ? (inputValue.trim() || null) : true)}
          >
            {isPrompt ? 'Submit' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  );
}
