import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton.jsx';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getVisibleFocusableElements(container) {
  return [...(container?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
    .filter((element) => element.getAttribute('aria-hidden') !== 'true'
      && !element.closest('[inert]')
      && element.getClientRects().length > 0);
}

export default function Dialog({ open, onClose, title, description, children, labelledBy }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const generatedId = useId();
  const titleId = labelledBy || `dialog-title-${generatedId}`;
  const descriptionId = `dialog-description-${generatedId}`;

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousActiveElement = document.activeElement;
    const appFrame = document.querySelector('.app-frame');
    const previousInert = appFrame?.inert ?? false;
    const previousBodyOverflow = document.body.style.overflow;
    const node = dialogRef.current;

    // Keep keyboard and assistive-technology interaction inside the modal.
    if (appFrame) appFrame.inert = true;
    document.body.style.overflow = 'hidden';

    const focusable = getVisibleFocusableElements(node);
    const preferred = node?.querySelector('[autofocus]');
    (preferred && preferred.getClientRects().length > 0 ? preferred : focusable[0] || node)?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !node) return;

      const controls = getVisibleFocusableElements(node);
      if (!controls.length) {
        event.preventDefault();
        node.focus();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (appFrame) appFrame.inert = previousInert;
      document.body.style.overflow = previousBodyOverflow;
      if (previousActiveElement?.isConnected) previousActiveElement.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <IconButton icon={X} label="Close dialog" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
