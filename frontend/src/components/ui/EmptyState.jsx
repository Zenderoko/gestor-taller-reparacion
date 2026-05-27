import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-secondary-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-secondary-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-secondary-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
