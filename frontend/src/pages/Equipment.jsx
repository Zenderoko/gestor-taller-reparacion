import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi, clientsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { EQUIPMENT_TYPES } from '@/lib/constants';
import { Plus, Wrench, Laptop, Smartphone, Tablet, Pencil, Archive, Trash2, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/shared/SearchInput';
import Loader from '@/components/shared/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  ...EQUIPMENT_TYPES,
];

export default function Equipment() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', search, type, showArchived, page],
    queryFn: () => equipmentApi.list({ search, type: type || undefined, showArchived: showArchived || undefined, page, limit: 20 }),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: equipmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipo registrado');
      setModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: (data) => equipmentApi.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipo actualizado');
      setEditModalOpen(false);
      setEditingId(null);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const typeIcons = { LAPTOP: Laptop, SMARTPHONE: Smartphone, TABLET: Tablet };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipos</h1>
          <p className="page-subtitle">Todos los equipos registrados en el taller</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Registrar equipo
        </Button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por marca, modelo o serial..." />
          </div>
          <div className="w-full sm:w-48">
            <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} options={TYPE_OPTIONS} />
          </div>
          <div className="flex items-center">
            <button
              onClick={() => { setShowArchived(!showArchived); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${showArchived ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'}`}
            >
              <Archive className="w-4 h-4" /> Archivados
            </button>
          </div>
        </div>

        {isLoading ? <Loader /> : equipment?.data?.length === 0 ? (
          <EmptyState icon={Wrench} title="No hay equipos" description="Registra el primer equipo" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Registrar</Button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Tipo</Th>
                  <Th>Equipo</Th>
                  <Th className="hidden sm:table-cell">Serial</Th>
                  <Th className="hidden md:table-cell">Cliente</Th>
                  <Th className="hidden md:table-cell">Registrado</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {equipment?.data?.map((eq) => {
                  const Icon = typeIcons[eq.type] || Wrench;
                  return (
                    <Tr key={eq.id}>
                      <Td><Icon className="w-4 h-4 text-secondary-500" /></Td>
                      <Td className="font-medium text-secondary-900">{eq.brand} {eq.model}</Td>
                      <Td className="hidden sm:table-cell text-secondary-500">{eq.serialNumber || '-'}</Td>
                      <Td className="hidden md:table-cell">{eq.client?.name}</Td>
                      <Td className="hidden md:table-cell text-secondary-500">{formatDate(eq.createdAt)}</Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <div className="group relative">
                            <button
                              className="text-secondary-400 hover:text-primary-600 transition-colors p-1"
                              onClick={() => {
                                setEditingId(eq.id);
                                setValue('clientId', eq.clientId);
                                setValue('type', eq.type);
                                setValue('brand', eq.brand);
                                setValue('model', eq.model);
                                setValue('serialNumber', eq.serialNumber || '');
                                setValue('password', eq.password || '');
                                setValue('accessories', eq.accessories || '');
                                setValue('condition', eq.condition || '');
                                setValue('notes', eq.notes || '');
                                setEditModalOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-secondary-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                              Editar
                            </div>
                          </div>
                          {eq.archived ? (
                            <div className="group relative">
                              <button className="text-green-500 hover:text-green-700 transition-colors p-1" onClick={async () => { try { await equipmentApi.unarchive(eq.id); queryClient.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipo restaurado'); } catch (e) { toast.error(e.message); } }}>
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-secondary-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                Restaurar
                              </div>
                            </div>
                          ) : (
                            <div className="group relative">
                              <button className="text-secondary-400 hover:text-orange-600 transition-colors p-1" onClick={async () => { try { await equipmentApi.archive(eq.id); queryClient.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipo archivado'); } catch (e) { toast.error(e.message); } }}>
                                <Archive className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-secondary-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                Archivar
                              </div>
                            </div>
                          )}
                          <div className="group relative">
                            <button className="text-secondary-400 hover:text-red-600 transition-colors p-1" onClick={async () => { if (window.confirm('¿Eliminar permanentemente este equipo?')) { try { await equipmentApi.delete(eq.id); queryClient.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipo eliminado'); } catch (e) { toast.error(e.message); } } }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-secondary-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                              Eliminar
                            </div>
                          </div>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={equipment?.totalPages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Registrar equipo">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select label="Cliente" required options={(clients?.data || []).map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar cliente" {...register('clientId', { required: true })} />
          <Select label="Tipo de equipo" required options={EQUIPMENT_TYPES} placeholder="Seleccionar tipo" {...register('type', { required: true })} />
          <Input label="Marca" required {...register('brand', { required: true })} />
          <Input label="Modelo" required {...register('model', { required: true })} />
          <Input label="Número de serie" {...register('serialNumber')} />
          <Input label="Contraseña" {...register('password')} />
          <Input label="Accesorios incluidos" {...register('accessories')} placeholder="Cargador, cable, funda..." />
          <Input label="Estado físico" {...register('condition')} placeholder="Bueno, rayado, golpeado..." />
          <Input label="Notas" {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); reset(); setEditingId(null); }} title="Editar equipo">
        <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
          <Select label="Cliente" required options={(clients?.data || []).map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar cliente" {...register('clientId', { required: true })} />
          <Select label="Tipo de equipo" required options={EQUIPMENT_TYPES} placeholder="Seleccionar tipo" {...register('type', { required: true })} />
          <Input label="Marca" required {...register('brand', { required: true })} />
          <Input label="Modelo" required {...register('model', { required: true })} />
          <Input label="Número de serie" {...register('serialNumber')} />
          <Input label="Contraseña" {...register('password')} />
          <Input label="Accesorios incluidos" {...register('accessories')} placeholder="Cargador, cable, funda..." />
          <Input label="Estado físico" {...register('condition')} placeholder="Bueno, rayado, golpeado..." />
          <Input label="Notas" {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setEditModalOpen(false); reset(); setEditingId(null); }}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || editMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
