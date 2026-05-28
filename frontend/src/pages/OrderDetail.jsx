import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { STATUS_LABELS, REPAIR_STATUS, PRIORITY_LABELS } from '@/lib/constants';
import { ArrowLeft, Printer, Send, Plus, Pencil, Archive, RotateCcw, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/shared/Loader';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const STATUS_ACTIONS = {
  [REPAIR_STATUS.PENDING]: [{ status: 'DIAGNOSING', label: 'Iniciar diagnóstico' }],
  [REPAIR_STATUS.DIAGNOSING]: [
    { status: 'IN_PROGRESS', label: 'Comenzar reparación' },
    { status: 'WAITING_PARTS', label: 'Esperar piezas' },
  ],
  [REPAIR_STATUS.IN_PROGRESS]: [
    { status: 'WAITING_PARTS', label: 'Esperar piezas' },
    { status: 'READY_FOR_PICKUP', label: 'Marcar listo' },
  ],
  [REPAIR_STATUS.WAITING_PARTS]: [
    { status: 'IN_PROGRESS', label: 'Reanudar reparación' },
  ],
  [REPAIR_STATUS.READY_FOR_PICKUP]: [
    { status: 'COMPLETED', label: 'Completar orden' },
  ],
  [REPAIR_STATUS.COMPLETED]: [
    { status: 'DELIVERED', label: 'Entregar al cliente' },
  ],
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusModal, setStatusModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (data) => ordersApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Estado actualizado');
      setStatusModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: (data) => ordersApi.addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Pago registrado');
      setPaymentModal(false);
      setPaymentAmount('');
    },
    onError: (err) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: (formData) => ordersApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Orden actualizada');
      setEditModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => ordersApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Orden archivada');
    },
    onError: (err) => toast.error(err.message),
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => ordersApi.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Orden restaurada');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ordersApi.delete(id),
    onSuccess: () => {
      toast.success('Orden eliminada');
      navigate('/orders');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Loader />;
  if (!data?.data) return <p className="text-center py-20 text-secondary-500">Orden no encontrada</p>;

  const order = data.data;
  const actions = STATUS_ACTIONS[order.status] || [];
  const remaining = Number(order.estimatedCost) - Number(order.deposit);

  return (
    <div className="page-container">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver a órdenes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-secondary-900">Orden #{order.orderNumber}</h1>
                <p className="text-sm text-secondary-500 mt-1">Creada el {formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <Badge variant={order.priority === 'URGENT' ? 'danger' : order.priority === 'HIGH' ? 'warning' : 'default'}>
                  {PRIORITY_LABELS[order.priority]}
                </Badge>
              </div>
            </div>

            <div className="card-body space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-secondary-700 mb-1">Problema reportado</h3>
                <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">{order.reportedIssue}</p>
              </div>
              {order.diagnosis && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary-700 mb-1">Diagnóstico</h3>
                  <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">{order.diagnosis}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary-700 mb-1">Notas</h3>
                  <p className="text-sm text-secondary-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-secondary-900">Historial de cambios</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {order.statusHistory?.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 pb-3 border-b border-secondary-100 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-secondary-400">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      {entry.note && <p className="text-sm text-secondary-600 mt-1">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-secondary-900">Cliente</h3>
            </div>
            <div className="card-body">
              <p className="font-medium text-secondary-900">{order.client.name}</p>
              <p className="text-sm text-secondary-500">{order.client.phone}</p>
              {order.client.email && <p className="text-sm text-secondary-500">{order.client.email}</p>}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate(`/clients/${order.client.id}`)}>
                Ver cliente
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-secondary-900">Equipo</h3>
            </div>
            <div className="card-body">
              <p className="font-medium text-secondary-900">{order.equipment.brand} {order.equipment.model}</p>
              <p className="text-sm text-secondary-500">{order.equipment.type}</p>
              {order.equipment.serialNumber && <p className="text-sm text-secondary-500">Serial: {order.equipment.serialNumber}</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-secondary-900">Costos</h3>
            </div>
            <div className="card-body space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Presupuesto estimado:</span>
                <span className="font-medium">{formatCurrency(order.estimatedCost)}</span>
              </div>
              {Number(order.totalCost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Costo final:</span>
                  <span className="font-medium">{formatCurrency(order.totalCost)}</span>
                </div>
              )}
              {(Number(order.estimatedCost) > 0 || Number(order.deposit) > 0) && (
                <>
                  {Number(order.deposit) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600">Abono:</span>
                      <span className="font-medium">{formatCurrency(order.deposit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-secondary-200 pt-2">
                    <span>Saldo restante:</span>
                    <span className={remaining > 0 ? 'text-red-600' : remaining < 0 ? 'text-green-600' : ''}>{formatCurrency(remaining)}</span>
                  </div>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={() => setPaymentModal(true)}
                disabled={Number(order.estimatedCost) > 0 && Number(order.deposit) >= Number(order.estimatedCost)}
                title={Number(order.estimatedCost) > 0 && Number(order.deposit) >= Number(order.estimatedCost) ? 'El presupuesto ya está cubierto' : ''}
              >
                <Plus className="w-4 h-4" /> Registrar pago
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-secondary-900">Acciones</h3>
            </div>
            <div className="card-body space-y-2">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(action.status);
                    setStatusModal(true);
                  }}
                >
                  {action.label}
                </Button>
              ))}
              <Button variant="secondary" size="sm" className="w-full" onClick={() => {
                reset({
                  diagnosis: order.diagnosis || '',
                  totalCost: order.totalCost || '',
                  deposit: order.deposit || '',
                  estimatedCost: order.estimatedCost || '',
                  notes: order.notes || '',
                  internalNotes: order.internalNotes || '',
                  priority: order.priority,
                });
                setEditModal(true);
              }}>
                <Pencil className="w-4 h-4" /> Editar orden
              </Button>
              <Button
                variant="secondary" size="sm" className="w-full"
                onClick={async () => {
                  try {
                    const blob = await ordersApi.downloadPdf(order.id);
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
              >
                <Printer className="w-4 h-4" /> Imprimir PDF
              </Button>
              <Button
                variant="secondary" size="sm" className="w-full"
                onClick={async () => {
                  try {
                    await ordersApi.sendWhatsApp(order.id);
                    toast.success('WhatsApp enviado al cliente');
                  } catch (err) {
                    toast.error(err.message || 'Error al enviar WhatsApp. Revisa la conexión en la sección WhatsApp.');
                  }
                }}
              >
                <Send className="w-4 h-4" /> Enviar WhatsApp
              </Button>
              {order.archived ? (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => unarchiveMutation.mutate()} loading={unarchiveMutation.isPending}>
                  <RotateCcw className="w-4 h-4" /> Restaurar orden
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => archiveMutation.mutate()} loading={archiveMutation.isPending}>
                  <Archive className="w-4 h-4" /> Archivar orden
                </Button>
              )}
              <Button variant="danger" size="sm" className="w-full" onClick={() => { if (window.confirm('¿Eliminar permanentemente esta orden?')) deleteMutation.mutate(); }} loading={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" /> Eliminar orden
              </Button>
            </div>
          </div>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-secondary-900">Pagos registrados</h3>
              </div>
              <div className="card-body">
                {order.payments?.length === 0 ? (
                  <p className="text-sm text-secondary-500">Sin pagos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {order.payments?.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm py-1 border-b border-secondary-100 last:border-0">
                        <span className="text-secondary-600">{p.method || 'Efectivo'} - {formatDate(p.createdAt)}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Cambiar estado">
        <div className="space-y-4">
          <p className="text-sm text-secondary-600">
            Cambiar de <StatusBadge status={order.status} /> a <StatusBadge status={selectedStatus} />
          </p>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nota (opcional)</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Agrega un comentario..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancelar</Button>
            <Button onClick={() => statusMutation.mutate({ status: selectedStatus, note: statusNote })} loading={statusMutation.isPending}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Registrar pago">
        <div className="space-y-4">
          <Input label="Monto ($)" type="number" step="1" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          <Select
            label="Método de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'EFECTIVO', label: 'Efectivo' },
              { value: 'TRANSFERENCIA', label: 'Transferencia' },
              { value: 'DEBITO', label: 'Débito' },
              { value: 'CREDITO', label: 'Crédito' },
              { value: 'MERCADOPAGO', label: 'Mercado Pago' },
            ]}
          />
          <Input label="Referencia" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Nº de transacción..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPaymentModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!paymentAmount) return toast.error('Ingrese un monto');
                paymentMutation.mutate({ amount: parseFloat(paymentAmount), method: paymentMethod, reference: paymentNote });
              }}
              loading={paymentMutation.isPending}
            >
              Registrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar orden">
        <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
          <Input label="Presupuesto estimado ($)" type="number" step="1" {...register('estimatedCost')} />
          <Input label="Costo final ($)" type="number" step="1" {...register('totalCost')} />
          <Input label="Abono ($)" type="number" step="1" {...register('deposit')} />
          <Select
            label="Prioridad"
            options={[
              { value: 'LOW', label: 'Baja' },
              { value: 'MEDIUM', label: 'Media' },
              { value: 'HIGH', label: 'Alta' },
              { value: 'URGENT', label: 'Urgente' },
            ]}
            {...register('priority')}
          />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Diagnóstico</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('diagnosis')}
              placeholder="Diagnóstico del técnico..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Notas</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('notes')}
              placeholder="Notas de la orden..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Notas internas</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('internalNotes')}
              placeholder="Notas solo para el taller..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || editMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
