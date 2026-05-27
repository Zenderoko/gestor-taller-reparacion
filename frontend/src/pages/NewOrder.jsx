import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { clientsApi, equipmentApi, ordersApi } from '@/lib/api';
import { EQUIPMENT_TYPES, PRIORITY_LABELS } from '@/lib/constants';
import { ArrowLeft, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState(location.state?.clientId || '');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { clientId: selectedClient },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ limit: 200 }),
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment-by-client', selectedClient],
    queryFn: () => equipmentApi.list({ clientId: selectedClient, limit: 50 }),
    enabled: !!selectedClient,
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orden creada exitosamente');
      navigate(`/orders/${res.data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const watchClientId = watch('clientId');
  useEffect(() => {
    if (watchClientId !== selectedClient) {
      setSelectedClient(watchClientId);
    }
  }, [watchClientId]);

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver a órdenes
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="text-lg font-semibold text-secondary-900">Nueva orden de reparación</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Cliente"
                required
                placeholder="Seleccionar cliente"
                options={(clients?.data || []).map((c) => ({ value: c.id, label: c.name }))}
                {...register('clientId', { required: 'Seleccione un cliente' })}
                error={errors.clientId?.message}
              />

              <Select
                label="Equipo"
                required
                placeholder={selectedClient ? 'Seleccionar equipo' : 'Primero seleccione un cliente'}
                options={(equipment?.data || []).map((e) => ({ value: e.id, label: `${e.brand} ${e.model}` }))}
                {...register('equipmentId', { required: 'Seleccione un equipo' })}
                error={errors.equipmentId?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Problema reportado <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe el problema que presenta el equipo..."
                {...register('reportedIssue', { required: 'Describa el problema' })}
              />
              {errors.reportedIssue && <p className="text-sm text-red-600 mt-1">{errors.reportedIssue.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Prioridad"
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
                {...register('priority')}
              />
              <Input
                label="Presupuesto estimado ($)"
                type="number"
                step="1"
                {...register('estimatedCost')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Notas</label>
              <textarea
                rows={2}
                className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting}>Crear orden</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
