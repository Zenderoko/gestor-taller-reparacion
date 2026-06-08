import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_LABELS } from '@/lib/constants';

const COLORS = {
  PENDING: '#eab308',
  DIAGNOSING: '#3b82f6',
  IN_PROGRESS: '#6366f1',
  WAITING_PARTS: '#f97316',
  READY_FOR_PICKUP: '#22c55e',
  COMPLETED: '#10b981',
  DELIVERED: '#6b7280',
  CANCELLED: '#ef4444',
};

export default function StatusChart({ data }) {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    color: COLORS[item.status] || '#6b7280',
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-secondary-500 text-center py-8">Sin datos</p>;
  }

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-secondary-600">{item.name}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
