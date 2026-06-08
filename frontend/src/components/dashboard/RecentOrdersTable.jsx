import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

export default function RecentOrdersTable({ orders }) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return <p className="text-sm text-secondary-500 text-center py-4">No hay órdenes recientes</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          <th className="pb-3 pr-4">#</th>
          <th className="pb-3 pr-4">Cliente</th>
          <th className="pb-3 pr-4">Equipo</th>
          <th className="pb-3 pr-4">Estado</th>
          <th className="pb-3 pr-4">Fecha</th>
          <th className="pb-3 pr-4 text-right">Total</th>
          <th className="pb-3 text-right">Saldo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-secondary-100">
        {orders.map((order) => (
          <tr
            key={order.id}
            className="hover:bg-secondary-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <td className="py-3 pr-4 font-medium text-primary-600">{order.orderNumber}</td>
            <td className="py-3 pr-4">{order.client.name}</td>
            <td className="py-3 pr-4 text-secondary-600">
              {order.equipment.brand} {order.equipment.model}
            </td>
            <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
            <td className="py-3 pr-4 text-secondary-500">{formatDate(order.createdAt)}</td>
            <td className="py-3 pr-4 text-right font-medium">{formatCurrency(order.totalCost)}</td>
            <td className="py-3 text-right font-medium text-secondary-600">
              {(() => {
                const saldo = (Number(order.totalCost) || Number(order.estimatedCost)) - Number(order.deposit);
                return saldo > 0 ? formatCurrency(saldo) : '—';
              })()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
