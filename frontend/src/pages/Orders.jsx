import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ORDER_STATUS_OPTIONS, PRIORITY_LABELS } from '@/lib/constants';
import { Plus, ClipboardList } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/shared/SearchInput';
import Loader from '@/components/shared/Loader';
import EmptyState from '@/components/ui/EmptyState';
import Select from '@/components/ui/Select';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas las prioridades' },
  ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];

export default function Orders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status, priority, startDate, endDate, page],
    queryFn: () => ordersApi.list({ search, status: status || undefined, priority: priority || undefined, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 20 }),
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de reparación</h1>
          <p className="page-subtitle">Gestiona todas las órdenes del taller</p>
        </div>
        <Button onClick={() => navigate('/orders/new')}>
          <Plus className="w-4 h-4" />
          Nueva orden
        </Button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por #orden o problema..." />
            </div>
            <div className="w-full sm:w-48">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={ORDER_STATUS_OPTIONS} />
            </div>
            <div className="w-full sm:w-48">
              <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} options={PRIORITY_OPTIONS} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="w-full sm:w-48">
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No hay órdenes"
            description="Crea tu primera orden de reparación"
            action={<Button onClick={() => navigate('/orders/new')}><Plus className="w-4 h-4" /> Nueva orden</Button>}
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th># Orden</Th>
                  <Th>Cliente</Th>
                  <Th>Equipo</Th>
                  <Th>Estado</Th>
                  <Th>Presupuesto</Th>
                  <Th>Fecha</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.data?.map((order) => (
                  <Tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                    <Td className="font-medium text-primary-600">{order.orderNumber}</Td>
                    <Td className="font-medium text-secondary-900">{order.client.name}</Td>
                    <Td className="text-secondary-600">{order.equipment.brand} {order.equipment.model}</Td>
                    <Td><StatusBadge status={order.status} /></Td>
                    <Td>{formatCurrency(order.estimatedCost)}</Td>
                    <Td className="text-secondary-500">{formatDate(order.createdAt)}</Td>
                    <Td><span className="text-xs text-secondary-500">{order._count?.statusHistory} cambios</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
