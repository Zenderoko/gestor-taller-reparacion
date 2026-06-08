import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, formatPhone, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, MapPin, FileText, Wrench, ChevronRight, Plus, Pencil, Archive, Trash2, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Loader from '@/components/shared/Loader';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
  });

  const editMutation = useMutation({
    mutationFn: (formData) => clientsApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente actualizado');
      setEditModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => clientsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente archivado');
    },
    onError: (err) => toast.error(err.message),
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => clientsApi.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente restaurado');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado permanentemente');
      navigate('/clients');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Loader />;
  if (!data?.data) return <p className="text-center py-20 text-secondary-500">Cliente no encontrado</p>;

  const client = data.data;

  return (
    <div className="page-container">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver a clientes
      </button>

      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{client.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-secondary-500">
                {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{formatPhone(client.phone)}</span>}
                {client.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{client.email}</span>}
                {client.documentId && <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{client.documentId}</span>}
                {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{client.address}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => {
                reset({
                  name: client.name,
                  email: client.email || '',
                  phone: client.phone,
                  documentId: client.documentId || '',
                  address: client.address || '',
                  notes: client.notes || '',
                });
                setEditModal(true);
              }}>
                <Pencil className="w-4 h-4" /> Editar
              </Button>
              <Button onClick={() => navigate('/orders/new', { state: { clientId: client.id } })}>
                <Plus className="w-4 h-4" /> Nueva orden
              </Button>
              {client.archived ? (
                <Button variant="secondary" onClick={() => unarchiveMutation.mutate()} loading={unarchiveMutation.isPending}>
                  <RotateCcw className="w-4 h-4" /> Restaurar
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => archiveMutation.mutate()} loading={archiveMutation.isPending}>
                  <Archive className="w-4 h-4" /> Archivar
                </Button>
              )}
              <Button variant="secondary" onClick={() => {
                if (window.confirm('¿Eliminar permanentemente este cliente? Esta acción no se puede deshacer.')) {
                  deleteMutation.mutate();
                }
              }} loading={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </Button>
            </div>
          </div>
          {client.notes && (
            <div className="mt-4 p-3 bg-secondary-50 rounded-lg text-sm text-secondary-600">
              {client.notes}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900">Equipos ({client.equipments?.length || 0})</h3>
          </div>
          <div className="card-body">
            {client.equipments?.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-4">Sin equipos registrados</p>
            ) : (
              <div className="space-y-3">
                {client.equipments.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{eq.brand} {eq.model}</p>
                      <p className="text-xs text-secondary-500">{eq.type} {eq.serialNumber && `• ${eq.serialNumber}`}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-secondary-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-secondary-900">Historial de órdenes ({client.orders?.length || 0})</h3>
          </div>
          <div className="card-body p-0">
            {client.orders?.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-8">Sin órdenes de reparación</p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th className="hidden sm:table-cell">Equipo</Th>
                    <Th>Estado</Th>
                    <Th className="hidden sm:table-cell">Fecha</Th>
                    <Th className="hidden sm:table-cell"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {client.orders.map((order) => (
                    <Tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                      <Td className="font-medium text-primary-600">{order.orderNumber}</Td>
                      <Td className="hidden sm:table-cell">{order.equipment?.brand} {order.equipment?.model}</Td>
                      <Td><StatusBadge status={order.status} /></Td>
                      <Td className="hidden sm:table-cell text-secondary-500">{formatDate(order.createdAt)}</Td>
                      <Td className="hidden sm:table-cell"><ChevronRight className="w-4 h-4 text-secondary-400" /></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar cliente">
        <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
          <Input label="Nombre" required {...register('name', { required: 'El nombre es requerido' })} error={errors.name?.message} />
          <Input label="Teléfono" required {...register('phone', { required: 'El teléfono es requerido' })} error={errors.phone?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="DNI / Documento" {...register('documentId')} />
          <Input label="Dirección" {...register('address')} />
          <Input label="Notas" {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || editMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
