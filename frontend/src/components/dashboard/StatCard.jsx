import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xl font-bold text-secondary-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
