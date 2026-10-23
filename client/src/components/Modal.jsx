import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WIDTHS = {
  sm: '400px',
  md: '520px',
  lg: '720px',
  xl: '960px',
};

export default function Modal({ title, children, onClose, footer, width = 'md' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-xl flex flex-col border border-brew-border ${
          isMobile
            ? 'w-full h-full rounded-none'
            : 'rounded-lg max-h-[90vh] max-w-[calc(100%-2rem)]'
        }`}
        style={!isMobile ? { width: WIDTHS[width] || WIDTHS.md } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 md:p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-4 md:px-5 py-3 border-t border-brew-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}