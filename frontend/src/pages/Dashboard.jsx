import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { REPAIR_STATUS, STATUS_LABELS } from '@/lib/constants';
import StatCard from '@/components/dashboard/StatCard';
import RecentOrdersTable from '@/components/dashboard/RecentOrdersTable';
import StatusChart from '@/components/dashboard/StatusChart';
import { Wrench, Users, ClipboardList, DollarSign, Clock, AlertCircle } from 'lucide-react';
import Loader from '@/components/shared/Loader';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) return <Loader />;

  const { overview, recentOrders, statusDistribution, upcomingDeliveries } = data?.data || {};

  const stats = [
    { label: 'Órdenes activas', value: overview?.activeOrders || 0, icon: Wrench, color: 'text-blue-600 bg-blue-100' },
    { label: 'Clientes registrados', value: overview?.totalClients || 0, icon: Users, color: 'text-green-600 bg-green-100' },
    { label: 'Órdenes del mes', value: overview?.ordersThisMonth || 0, icon: ClipboardList, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Ingresos del mes', value: formatCurrency(overview?.revenueThisMonth || 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Pendientes', value: overview?.pendingOrders || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { label: 'Total de las órdenes', value: formatCurrency(overview?.totalCost || 0), icon: AlertCircle, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del taller</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="font-semibold text-secondary-900">Órdenes recientes</h3>
          </div>
          <div className="card-body">
            <RecentOrdersTable orders={recentOrders || []} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-secondary-900">Distribución de estados</h3>
          </div>
          <div className="card-body">
            <StatusChart data={statusDistribution || []} />
          </div>
        </div>
      </div>

      {upcomingDeliveries?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-secondary-900">Listos para retirar</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {upcomingDeliveries.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{order.client.name}</p>
                    <p className="text-xs text-secondary-500">#{order.orderNumber}</p>
                  </div>
                  <span className="text-xs text-secondary-500">{order.client.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
