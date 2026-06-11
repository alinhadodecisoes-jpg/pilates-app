'use client';

import { useEffect } from 'react';

/**
 * Proteções anti-cópia (dificultam, não impedem 100% — print de tela é controlado pelo SO).
 * Exceções: campos de formulário e qualquer elemento com [data-allow-copy]
 * (ex.: código PIX / dados de pagamento que precisam ser copiados).
 */
export function AntiCopy() {
  useEffect(() => {
    const isAllowed = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || !el.closest) return false;
      return !!el.closest('[data-allow-copy], input, textarea, select');
    };

    const onContextMenu = (e: MouseEvent) => { if (!isAllowed(e.target)) e.preventDefault(); };
    const onDragStart = (e: DragEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === 'IMG') e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && (k === 'I' || k === 'J' || k === 'C')) { e.preventDefault(); return; }
      if (e.ctrlKey && (k === 'U' || k === 'S')) { e.preventDefault(); return; }
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('keydown', onKeyDown);

    const style = document.createElement('style');
    style.id = 'anti-copy-style';
    style.innerHTML = `
      * { -webkit-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }
      [data-allow-copy], [data-allow-copy] *, input, textarea, select {
        -webkit-user-select: text !important; -ms-user-select: text !important; user-select: text !important;
      }
      img { -webkit-user-drag: none; user-drag: none; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('keydown', onKeyDown);
      document.getElementById('anti-copy-style')?.remove();
    };
  }, []);

  return null;
}
