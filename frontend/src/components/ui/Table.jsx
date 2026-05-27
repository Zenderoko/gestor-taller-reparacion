import { cn } from '@/lib/utils';

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children, className }) {
  return (
    <thead className={cn('bg-secondary-50 border-b border-secondary-200', className)}>
      {children}
    </thead>
  );
}

export function Th({ children, className }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

export function Tbody({ children, className }) {
  return <tbody className={cn('divide-y divide-secondary-100', className)}>{children}</tbody>;
}

export function Tr({ children, className, onClick }) {
  return (
    <tr
      className={cn('hover:bg-secondary-50 transition-colors', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }) {
  return <td className={cn('px-4 py-3 text-sm text-secondary-700', className)}>{children}</td>;
}
