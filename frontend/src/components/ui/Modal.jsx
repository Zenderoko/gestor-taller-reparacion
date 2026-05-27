import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ open, onClose, title, children, className, size = 'md' }) {
  const overlayRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={cn('bg-white rounded-xl shadow-xl w-full', sizes[size], className)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100">
          <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
